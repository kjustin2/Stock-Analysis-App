import axios from 'axios';
import { 
  ErrorLogger, 
  createNetworkError, 
  createTimeoutError, 
  createValidationError, 
  createApiKeyError,
  createDataError,
  createRateLimitError 
} from './errors';
import { RateLimiter } from './rateLimiter';
import { cacheService, CacheKeys, CachePriority } from './cacheService';
import { technicalIndicatorService } from './technicalIndicatorService';
import { ServiceHealthTracker } from './serviceHealthTracker';

// Types for stock data
export interface StockInfo {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
}

export interface ChartDataPoint {
  x: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface ChartData {
  symbol: string;
  period: string;
  data: ChartDataPoint[];
  data_points: number;
  technicalData?: import('./technicalIndicatorService').TechnicalData;
}

// Enhanced API Configuration
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const YAHOO_PROXY_URL = 'https://api.allorigins.win/get?url=';
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Standardized timeout configurations
const TIMEOUT_CONFIG = {
  finnhub: 6000,    // 6 seconds for Finnhub (premium service)
  yahoo: 8000,      // 8 seconds for Yahoo (may be slower through proxy)
  chart: 10000      // 10 seconds for chart data (larger responses)
};

export class StockDataService {
  private static instance: StockDataService;
  private readonly finnhubApiKey: string;
  private rateLimiter: RateLimiter;
  private errorLogger: ErrorLogger;
  private healthTracker: ServiceHealthTracker;

  constructor() {
    // Initialize error logging and rate limiting
    this.errorLogger = ErrorLogger.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.healthTracker = ServiceHealthTracker.getInstance({
      failureThreshold: 3,
      recoveryTimeoutMs: 30000,    // 30 seconds
      healthWindowMs: 300000,      // 5 minutes
      minRequestsForHealth: 5
    });
    
    // Get API key from environment variables
    this.finnhubApiKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    
    this.validateApiKeyConfiguration();

    // Check if API key is available and log status
    if (!this.finnhubApiKey) {
      console.warn('⚠️ Finnhub API key not found. Will use Yahoo Finance only.');
    }

    // Cache setup for improved performance
    this.cache = new Map();
    this.healthTracker = ServiceHealthTracker.getInstance();

    // Initialize rate limiter for better API management
    this.rateLimiter = RateLimiter.getInstance();
  }

  public static getInstance(): StockDataService {
    if (!StockDataService.instance) {
      StockDataService.instance = new StockDataService();
    }
    return StockDataService.instance;
  }

  private validateApiKeyConfiguration(): void {
    if (!this.finnhubApiKey) {
      this.errorLogger.log(
        createApiKeyError('Finnhub API key not provided', 'system', {
          recommendation: 'Add VITE_FINNHUB_API_KEY to your .env file',
        })
      );
    } else {
      // console.log('✅ Finnhub API key loaded successfully');
    }
  }

  /**
   * Get the best available data source based on health tracking
   */
  private getBestDataSource(): string[] {
    const availableServices = [];
    
    // Check if Finnhub is available and we have API key
    if (this.finnhubApiKey && this.healthTracker.isServiceAvailable('finnhub')) {
      availableServices.push('finnhub');
    }
    
    // Yahoo Finance is always available as fallback
    if (this.healthTracker.isServiceAvailable('yahoo')) {
      availableServices.push('yahoo');
    }
    
    // Get services ordered by health score
    const servicesByHealth = this.healthTracker.getServicesByHealth()
      .filter(service => availableServices.includes(service.serviceName))
      .map(service => service.serviceName);
    
    // If no health-ordered services, fallback to default order
    if (servicesByHealth.length === 0) {
      return availableServices;
    }
    
    return servicesByHealth;
  }

  async getStockInfo(symbol: string): Promise<StockInfo> {
    // Validate input
    if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
      const validationError = createValidationError(
        'Invalid symbol provided',
        'system',
        { symbol },
        { method: 'getStockInfo' }
      );
      this.errorLogger.log(validationError);
      throw validationError;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const cacheKey = CacheKeys.stockInfo(cleanSymbol);
    
    const cachedData = cacheService.get<StockInfo>(cacheKey);
    if (cachedData) {
      // console.log(`📦 Using cached data for ${cleanSymbol}`);
      return cachedData;
    }

    const startTime = Date.now();
    const dataSourceOrder = this.getBestDataSource();
    const errors: Error[] = [];

    // console.log(`🎯 Attempting data fetch for ${cleanSymbol} with source order: ${dataSourceOrder.join(' → ')}`);

    let lastError: any = null;

    for (const source of dataSourceOrder) {
      const requestStart = Date.now();
      try {
        let stockInfo: StockInfo;

        if (source === 'finnhub') {
          stockInfo = await this.rateLimiter.executeRequest(
            'finnhub',
            cleanSymbol,
            () => this.fetchStockInfoFromFinnhub(cleanSymbol),
            1 // High priority for real-time data
          );
        } else if (source === 'yahoo') {
          stockInfo = await this.rateLimiter.executeRequest(
            'yahoo',
            cleanSymbol,
            () => this.fetchStockInfoFromYahoo(cleanSymbol),
            0 // Normal priority for fallback
          );
        } else {
          continue; // Skip unknown sources
        }

        const responseTime = Date.now() - requestStart;
        
        // Record successful request
        this.healthTracker.recordSuccess(source, responseTime);
        
        const totalFetchTime = Date.now() - startTime;
        // console.log(`✅ Data fetched from ${source} for ${cleanSymbol}: $${stockInfo.current_price} (${responseTime}ms, total: ${totalFetchTime}ms)`);
        
        // Cache with priority based on source
        const cachePriority = source === 'finnhub' ? CachePriority.HIGH : CachePriority.MEDIUM;
        cacheService.set(cacheKey, stockInfo, undefined, cachePriority);
        
        return stockInfo;
        
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        
        // Record failed request
        this.healthTracker.recordFailure(source, error);
        
        // console.warn(`⚠️ ${source} fetch failed after ${responseTime}ms for ${cleanSymbol}:`, error);
        
        // Log the error but continue to next source
        if (error instanceof Error && 'details' in error) {
          this.errorLogger.log(error as any);
          errors.push(error);
        }
        lastError = error;
      }
    }

    // All sources failed
    const totalTime = Date.now() - startTime;
    const networkError = createNetworkError(
      `Unable to fetch real-time data for ${cleanSymbol}. All available data sources failed.`,
      'all',
      lastError,
      { 
        symbol: cleanSymbol, 
        totalFetchTime: totalTime, 
        attemptedSources: dataSourceOrder,
        healthStatus: this.healthTracker.getSystemHealthSummary(),
        errorCount: errors.length
      }
    );
    
    this.errorLogger.log(networkError);
    // console.error('❌ All data sources failed:', { errors, healthStatus: this.healthTracker.getSystemHealthSummary() });
    throw networkError;
  }

  private async fetchStockInfoFromFinnhub(symbol: string): Promise<StockInfo> {
    try {
      // Get current quote from Finnhub with timeout and error handling
      const quoteResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
        params: {
          symbol: symbol,
          token: this.finnhubApiKey
        },
        timeout: TIMEOUT_CONFIG.finnhub
      });

      const quote = quoteResponse.data;

      // Enhanced validation for Finnhub response
      if (!quote || typeof quote !== 'object') {
        throw createDataError(
          'Invalid response structure from Finnhub',
          'finnhub',
          quote,
          { symbol, endpoint: 'quote' }
        );
      }

      if (quote.c === undefined || quote.pc === undefined || quote.c === 0) {
        throw createValidationError(
          'Invalid or missing quote data from Finnhub',
          'finnhub',
          quote,
          { symbol, missingFields: ['current_price', 'previous_close'] }
        );
      }

      // Get company profile for the name with separate error handling
      let companyName = `${symbol} Inc.`;
      try {
        const profileResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
          params: {
            symbol: symbol,
            token: this.finnhubApiKey
          },
          timeout: TIMEOUT_CONFIG.finnhub
        });

        if (profileResponse.data && profileResponse.data.name) {
          companyName = profileResponse.data.name;
        }
      } catch (profileError) {
        // Log profile fetch failure but don't fail the whole request
        const profileErr = createNetworkError(
          'Could not fetch company profile from Finnhub',
          'finnhub',
          profileError,
          { symbol, endpoint: 'profile2' }
        );
        this.errorLogger.log(profileErr);
      }

      const stockInfo: StockInfo = {
        symbol: symbol,
        name: companyName,
        current_price: parseFloat(quote.c.toFixed(2)),
        previous_close: parseFloat(quote.pc.toFixed(2))
      };

      // Additional data validation
      if (stockInfo.current_price <= 0 || stockInfo.previous_close <= 0) {
        throw createValidationError(
          'Invalid price data from Finnhub (negative or zero values)',
          'finnhub',
          { current_price: stockInfo.current_price, previous_close: stockInfo.previous_close },
          { symbol }
        );
      }

      return stockInfo;

    } catch (error) {
      // Enhanced error handling with proper categorization
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw createTimeoutError(
            `Finnhub request timed out for ${symbol}`,
            'finnhub',
            TIMEOUT_CONFIG.finnhub,
            { symbol }
          );
        }
        
        if (error.response?.status === 401) {
          throw createApiKeyError(
            'Invalid Finnhub API key',
            'finnhub',
            { symbol, status: error.response.status }
          );
        }
        
        if (error.response?.status === 429) {
          throw createRateLimitError(
            'Finnhub rate limit exceeded',
            'finnhub',
            60000, // 1 minute retry
            { symbol, status: error.response.status }
          );
        }
        
        throw createNetworkError(
          `Finnhub API error for ${symbol}`,
          'finnhub',
          error,
          { 
            symbol, 
            status: error.response?.status,
            statusText: error.response?.statusText 
          }
        );
      }
      
      // Re-throw custom errors as-is
      if (error && typeof error === 'object' && 'details' in error) {
        throw error;
      }
      
      // Unknown error
      throw createNetworkError(
        `Unknown error fetching from Finnhub for ${symbol}`,
        'finnhub',
        error,
        { symbol }
      );
    }
  }

  private async fetchStockInfoFromYahoo(symbol: string): Promise<StockInfo> {
    // Try direct Yahoo method first
    try {
      const stockInfo = await this.fetchStockInfoYahooDirect(symbol);
      if (stockInfo) return stockInfo;
    } catch (error) {
      // console.warn('Yahoo direct method failed, trying chart extraction:', error);
      
      // Log the direct method failure
      const directError = createNetworkError(
        'Yahoo direct method failed',
        'yahoo',
        error,
        { symbol, method: 'direct' }
      );
      this.errorLogger.log(directError);
    }

    // Fallback to chart-based extraction
    try {
      return await this.fetchStockInfoFromYahooChart(symbol);
    } catch (error) {
      throw createNetworkError(
        `All Yahoo Finance methods failed for ${symbol}`,
        'yahoo',
        error,
        { symbol, attemptedMethods: ['direct', 'chart'] }
      );
    }
  }

  private async fetchStockInfoYahooDirect(symbol: string): Promise<StockInfo | null> {
    try {
      const yahooUrl = `${YAHOO_FINANCE_BASE}/${symbol}?interval=1d&range=2d`;
      const response = await axios.get(`${YAHOO_PROXY_URL}${encodeURIComponent(yahooUrl)}`, {
        timeout: TIMEOUT_CONFIG.yahoo
      });

      let yahooData;
      if (response.data && response.data.contents) {
        yahooData = JSON.parse(response.data.contents);
      } else {
        yahooData = response.data;
      }

      if (!yahooData?.chart?.result?.[0]) {
        throw createDataError(
          'Invalid response structure from Yahoo Finance',
          'yahoo',
          yahooData,
          { symbol, method: 'direct' }
        );
      }

      const result = yahooData.chart.result[0];
      const meta = result.meta;
      
      const currentPrice = meta.regularMarketPrice || meta.previousClose || meta.price || meta.currentPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
      const symbolName = meta.symbol || symbol;
      const companyName = meta.longName || meta.shortName || meta.displayName || `${symbolName} Inc.`;

      if (!currentPrice || !previousClose || !symbolName) {
        return null;
      }

      const stockInfo: StockInfo = {
        symbol: symbolName.toUpperCase(),
        name: companyName,
        current_price: parseFloat(currentPrice.toFixed(2)),
        previous_close: parseFloat(previousClose.toFixed(2))
      };

      if (stockInfo.current_price <= 0 || stockInfo.previous_close <= 0) {
        return null;
      }

      return stockInfo;
    } catch (error) {
      // Enhanced error handling with proper categorization
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw createTimeoutError(
            `Yahoo direct method timed out for ${symbol}`,
            'yahoo',
            TIMEOUT_CONFIG.yahoo,
            { symbol }
          );
        }
        
        if (error.response?.status === 401) {
          throw createApiKeyError(
            'Invalid Yahoo API key',
            'yahoo',
            { symbol, status: error.response.status }
          );
        }
        
        if (error.response?.status === 429) {
          throw createRateLimitError(
            'Yahoo rate limit exceeded',
            'yahoo',
            60000, // 1 minute retry
            { symbol, status: error.response.status }
          );
        }
        
        throw createNetworkError(
          `Yahoo API error for ${symbol}`,
          'yahoo',
          error,
          { 
            symbol, 
            status: error.response?.status,
            statusText: error.response?.statusText 
          }
        );
      }
      
      // Re-throw custom errors as-is
      if (error && typeof error === 'object' && 'details' in error) {
        throw error;
      }
      
      // Unknown error
      throw createNetworkError(
        `Unknown error fetching from Yahoo Finance for ${symbol}`,
        'yahoo',
        error,
        { symbol }
      );
    }
  }

  private async fetchStockInfoFromYahooChart(symbol: string): Promise<StockInfo> {
    const chartData = await this.getChartData(symbol, '1w');
    
    if (!chartData || chartData.data.length < 2) {
      throw new Error('Insufficient chart data for price extraction');
    }

    const latestData = chartData.data[chartData.data.length - 1];
    const previousData = chartData.data[chartData.data.length - 2];

    const stockInfo: StockInfo = {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Inc.`,
      current_price: parseFloat(latestData.c.toFixed(2)),
      previous_close: parseFloat(previousData.c.toFixed(2))
    };

    if (stockInfo.current_price <= 0 || stockInfo.previous_close <= 0) {
      throw new Error('Invalid price data extracted from chart');
    }

    return stockInfo;
  }

  async getChartData(symbol: string, period: string): Promise<ChartData> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const cacheKey = CacheKeys.chartData(cleanSymbol, period);
    
    const cachedData = cacheService.get<ChartData>(cacheKey);
    if (cachedData) {
      // console.log(`📦 Using cached chart data for ${cleanSymbol} (${period})`);
      return cachedData;
    }

    const startTime = Date.now();
    const dataSourceOrder = this.getBestDataSource();
    const errors: Error[] = [];

    // console.log(`📊 Fetching chart data for ${cleanSymbol} (${period}) with source order: ${dataSourceOrder.join(' → ')}`);

    let lastError: any = null;

    for (const source of dataSourceOrder) {
      const requestStart = Date.now();
      try {
        let chartData: ChartData;

        if (source === 'finnhub') {
          chartData = await this.fetchChartDataFromFinnhub(cleanSymbol, period);
        } else if (source === 'yahoo') {
          chartData = await this.fetchChartDataFromYahoo(cleanSymbol, period);
        } else {
          continue; // Skip unknown sources
        }

        const responseTime = Date.now() - requestStart;
        
        // Record successful request
        this.healthTracker.recordSuccess(source, responseTime);
        
        const totalFetchTime = Date.now() - startTime;
        // console.log(`✅ Chart data fetched from ${source} for ${cleanSymbol}: ${chartData.data.length} points (${responseTime}ms, total: ${totalFetchTime}ms)`);
        
        // Cache with priority based on source and data type
        const cachePriority = source === 'finnhub' ? CachePriority.MEDIUM : CachePriority.LOW;
        cacheService.set(cacheKey, chartData, undefined, cachePriority);
        
        return chartData;
        
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        
        // Record failed request
        this.healthTracker.recordFailure(source, error);
        
        // console.warn(`⚠️ ${source} chart fetch failed after ${responseTime}ms for ${cleanSymbol} (${period}):`, error);
        
        // Log the error but continue to next source
        if (error instanceof Error) {
          this.errorLogger.log(createNetworkError(
            `Chart data fetch failed from ${source}`,
            source,
            error,
            { symbol: cleanSymbol, period, responseTime }
          ));
          errors.push(error);
        }
        lastError = error;
      }
    }

    // All sources failed
    const totalTime = Date.now() - startTime;
    const networkError = createNetworkError(
      `Unable to fetch chart data for ${cleanSymbol} (${period}). All available data sources failed.`,
      'all',
      lastError,
      { 
        symbol: cleanSymbol, 
        period,
        totalFetchTime: totalTime, 
        attemptedSources: dataSourceOrder,
        healthStatus: this.healthTracker.getSystemHealthSummary(),
        errorCount: errors.length
      }
    );
    
    this.errorLogger.log(networkError);
    // console.error('❌ All chart data sources failed:', { errors, healthStatus: this.healthTracker.getSystemHealthSummary() });
    throw networkError;
  }

  // New method to get chart data with technical indicators for ML analysis
  async getChartDataWithTechnicals(symbol: string, period: string): Promise<ChartData> {
    // Get basic chart data first
    const chartData = await this.getChartData(symbol, period);
    
    try {
      // Calculate technical indicators using static import
      const technicalData = technicalIndicatorService.calculateTechnicalIndicators(
        chartData.data,
        symbol,
        period
      );
      
      // Return chart data with technical indicators included
      return {
        ...chartData,
        technicalData: technicalData
      };
    } catch (error) {
      // console.warn('Failed to calculate technical indicators for ML analysis:', error);
      // Return chart data without technical indicators if calculation fails
      return chartData;
    }
  }

  private async fetchChartDataFromFinnhub(symbol: string, period: string): Promise<ChartData> {
    // Map periods to Finnhub resolution and date ranges
    const resolutionMap: Record<string, string> = {
      '1d': '5',   // 5-minute resolution
      '1w': '60',  // 1-hour resolution  
      '1m': 'D',   // Daily resolution
      '3m': 'D',   // Daily resolution
      '6m': 'W',   // Weekly resolution
      '1y': 'W',   // Weekly resolution
      '5y': 'M'    // Monthly resolution
    };

    const resolution = resolutionMap[period];
    if (!resolution) {
      throw new Error(`Invalid period for Finnhub: ${period}`);
    }

    // Calculate date range
    const now = Math.floor(Date.now() / 1000);
    const ranges: Record<string, number> = {
      '1d': 86400,        // 1 day
      '1w': 7 * 86400,    // 1 week
      '1m': 30 * 86400,   // 1 month
      '3m': 90 * 86400,   // 3 months
      '6m': 180 * 86400,  // 6 months
      '1y': 365 * 86400,  // 1 year
      '5y': 5 * 365 * 86400 // 5 years
    };

    const from = now - ranges[period];

    const response = await axios.get(`${FINNHUB_BASE_URL}/stock/candle`, {
      params: {
        symbol: symbol.toUpperCase(),
        resolution: resolution,
        from: from,
        to: now,
        token: this.finnhubApiKey
      },
      timeout: 8000 // Optimized timeout for chart data
    });

    const data = response.data;

    if (!data || data.s !== 'ok' || !data.t || !Array.isArray(data.t)) {
      throw new Error('Invalid chart data from Finnhub');
    }

    // Convert Finnhub data to our format
    const validDataPoints: ChartDataPoint[] = [];
    
    for (let i = 0; i < data.t.length; i++) {
      const timestamp = data.t[i] * 1000; // Convert to milliseconds
      const open = data.o[i];
      const high = data.h[i];
      const low = data.l[i];
      const close = data.c[i];
      const volume = data.v[i];

      if (close !== null && close !== undefined && close > 0) {
        validDataPoints.push({
          x: new Date(timestamp).toISOString(),
          o: parseFloat(open.toFixed(2)),
          h: parseFloat(high.toFixed(2)),
          l: parseFloat(low.toFixed(2)),
          c: parseFloat(close.toFixed(2)),
          v: volume || 0
        });
      }
    }

    if (validDataPoints.length === 0) {
      throw new Error('No valid chart data points from Finnhub');
    }

    return {
      symbol: symbol.toUpperCase(),
      period: period,
      data: validDataPoints,
      data_points: validDataPoints.length
    };
  }

  private async fetchChartDataFromYahoo(symbol: string, period: string): Promise<ChartData> {
    const rangeMap: Record<string, string> = {
      '1d': '1d',
      '1w': '5d',
      '1m': '1mo',
      '3m': '3mo',
      '6m': '6mo',
      '1y': '1y',
      '5y': '5y'
    };

    const intervalMap: Record<string, string> = {
      '1d': '1h',
      '1w': '1d',
      '1m': '1d',
      '3m': '1d',
      '6m': '1wk',
      '1y': '1wk',
      '5y': '1mo'
    };

    const range = rangeMap[period];
    const interval = intervalMap[period];

    if (!range || !interval) {
      throw new Error(`Invalid period: ${period}`);
    }

    const yahooUrl = `${YAHOO_FINANCE_BASE}/${symbol}?interval=${interval}&range=${range}`;
    const response = await axios.get(`${YAHOO_PROXY_URL}${encodeURIComponent(yahooUrl)}`, {
      timeout: 8000 // Faster timeout for Yahoo chart data
    });

    let yahooData;
    if (response.data && response.data.contents) {
      yahooData = JSON.parse(response.data.contents);
    } else {
      yahooData = response.data;
    }

    if (!yahooData?.chart?.result?.[0]) {
      throw new Error('Invalid chart response structure from Yahoo Finance');
    }

    const result = yahooData.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];

    if (!timestamps || !quotes || !Array.isArray(timestamps)) {
      throw new Error('Missing required chart data from Yahoo Finance');
    }

    const validDataPoints: ChartDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const open = quotes.open?.[i];
      const high = quotes.high?.[i];
      const low = quotes.low?.[i];
      const close = quotes.close?.[i];
      const volume = quotes.volume?.[i];

      if (timestamp && close !== null && close !== undefined && close > 0) {
        validDataPoints.push({
          x: new Date(timestamp * 1000).toISOString(),
          o: open || close,
          h: high || close,
          l: low || close,
          c: parseFloat(close.toFixed(2)),
          v: volume || 0
        });
      }
    }

    if (validDataPoints.length === 0) {
      throw new Error('No valid chart data points received');
    }

    return {
      symbol: symbol.toUpperCase(),
      period: period,
      data: validDataPoints,
      data_points: validDataPoints.length
    };
  }

  /**
   * Get health status of all data sources for debugging and monitoring
   */
  public getServiceHealthStatus(): {
    overall: ReturnType<ServiceHealthTracker['getSystemHealthSummary']>;
    services: Array<{
      name: string;
      status: ReturnType<ServiceHealthTracker['getServiceStatus']>;
    }>;
  } {
    const services = ['finnhub', 'yahoo'];
    return {
      overall: this.healthTracker.getSystemHealthSummary(),
      services: services.map(name => ({
        name,
        status: this.healthTracker.getServiceStatus(name)
      }))
    };
  }

  /**
   * Reset health tracking for a specific service (useful for testing)
   */
  public resetServiceHealth(serviceName: string): void {
    this.healthTracker.resetServiceHealth(serviceName);
    // console.log(`🔄 Health tracking reset for ${serviceName}`);
  }

  /**
   * Reset health tracking for all services
   */
  public resetAllServiceHealth(): void {
    this.resetServiceHealth('finnhub');
    this.resetServiceHealth('yahoo');
    // console.log('🔄 Health tracking reset for all services');
  }
}

export const stockDataService = StockDataService.getInstance(); 