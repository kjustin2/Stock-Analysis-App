import axios from 'axios';

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
}

// API Configuration
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const YAHOO_PROXY_URL = 'https://api.allorigins.win/get?url=';
const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export class StockDataService {
  private static instance: StockDataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes for real-time freshness
  private readonly finnhubApiKey: string;

  constructor() {
    // Get API key from environment variables (set during build via GitHub Actions)
    this.finnhubApiKey = import.meta.env.VITE_FINNHUB_API_KEY || '';
    
    if (!this.finnhubApiKey) {
      console.warn('⚠️ Finnhub API key not found. Will use Yahoo Finance only.');
    } else {
      console.log('✅ Finnhub API key loaded successfully');
    }
  }

  public static getInstance(): StockDataService {
    if (!StockDataService.instance) {
      StockDataService.instance = new StockDataService();
    }
    return StockDataService.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getStockInfo(symbol: string): Promise<StockInfo> {
    const cacheKey = `stock_info_${symbol}`;
    
    if (this.isCacheValid(cacheKey)) {
      console.log(`📦 Using cached data for ${symbol}`);
      return this.getCachedData(cacheKey);
    }

    const startTime = Date.now();

    // Try Finnhub first (if API key available)
    if (this.finnhubApiKey) {
      try {
        const stockInfo = await this.fetchStockInfoFromFinnhub(symbol);
        const fetchTime = Date.now() - startTime;
        console.log(`✅ Real data fetched from Finnhub for ${symbol}: $${stockInfo.current_price} (${fetchTime}ms)`);
        this.setCachedData(cacheKey, stockInfo);
        return stockInfo;
      } catch (error) {
        console.warn(`⚠️ Finnhub fetch failed after ${Date.now() - startTime}ms, falling back to Yahoo Finance:`, error);
      }
    } else {
      console.log('⚠️ No Finnhub API key - using Yahoo Finance as primary source');
    }

    // Fallback to Yahoo Finance
    try {
      const stockInfo = await this.fetchStockInfoFromYahoo(symbol);
      const fetchTime = Date.now() - startTime;
      console.log(`✅ Real data fetched from Yahoo Finance for ${symbol}: $${stockInfo.current_price} (${fetchTime}ms)`);
      this.setCachedData(cacheKey, stockInfo);
      return stockInfo;
    } catch (error) {
      console.error('All data sources failed:', error);
      throw new Error(`Unable to fetch real-time data for ${symbol}. Please check the symbol and try again.`);
    }
  }

  private async fetchStockInfoFromFinnhub(symbol: string): Promise<StockInfo> {
    // Get current quote from Finnhub
    const quoteResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: this.finnhubApiKey
      },
      timeout: 5000 // Faster timeout for better performance
    });

    const quote = quoteResponse.data;

    // Validate Finnhub response
    if (!quote || quote.c === undefined || quote.pc === undefined) {
      throw new Error('Invalid quote data from Finnhub');
    }

    // Get company profile for the name
    let companyName = `${symbol.toUpperCase()} Inc.`;
    try {
      const profileResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
        params: {
          symbol: symbol.toUpperCase(),
          token: this.finnhubApiKey
        },
        timeout: 5000
      });

      if (profileResponse.data && profileResponse.data.name) {
        companyName = profileResponse.data.name;
      }
    } catch (error) {
      console.warn('Could not fetch company profile from Finnhub:', error);
    }

    const stockInfo: StockInfo = {
      symbol: symbol.toUpperCase(),
      name: companyName,
      current_price: parseFloat(quote.c.toFixed(2)),
      previous_close: parseFloat(quote.pc.toFixed(2))
    };

    // Validate data integrity
    if (stockInfo.current_price <= 0 || stockInfo.previous_close <= 0) {
      throw new Error('Invalid price data from Finnhub');
    }

    return stockInfo;
  }

  private async fetchStockInfoFromYahoo(symbol: string): Promise<StockInfo> {
    // Try direct Yahoo method first
    try {
      const stockInfo = await this.fetchStockInfoYahooDirect(symbol);
      if (stockInfo) return stockInfo;
    } catch (error) {
      console.warn('Yahoo direct method failed, trying chart extraction:', error);
    }

    // Fallback to chart-based extraction
    return await this.fetchStockInfoFromYahooChart(symbol);
  }

  private async fetchStockInfoYahooDirect(symbol: string): Promise<StockInfo | null> {
    const yahooUrl = `${YAHOO_FINANCE_BASE}/${symbol}?interval=1d&range=2d`;
    const response = await axios.get(`${YAHOO_PROXY_URL}${encodeURIComponent(yahooUrl)}`, {
      timeout: 8000 // Faster timeout for Yahoo Finance
    });

    let yahooData;
    if (response.data && response.data.contents) {
      yahooData = JSON.parse(response.data.contents);
    } else {
      yahooData = response.data;
    }

    if (!yahooData?.chart?.result?.[0]) {
      throw new Error('Invalid response structure from Yahoo Finance');
    }

    const result = yahooData.chart.result[0];
    const meta = result.meta;
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose || meta.price || meta.currentPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
    const symbolName = meta.symbol || symbol.toUpperCase();
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
    const cacheKey = `chart_data_${symbol}_${period}`;
    
    if (this.isCacheValid(cacheKey)) {
      console.log(`📦 Using cached chart data for ${symbol} (${period})`);
      return this.getCachedData(cacheKey);
    }

    const startTime = Date.now();

    // Try Finnhub first for historical data (if API key available)
    if (this.finnhubApiKey) {
      try {
        const chartData = await this.fetchChartDataFromFinnhub(symbol, period);
        const fetchTime = Date.now() - startTime;
        console.log(`✅ Real chart data fetched from Finnhub for ${symbol}: ${chartData.data.length} points (${fetchTime}ms)`);
        this.setCachedData(cacheKey, chartData);
        return chartData;
      } catch (error) {
        console.warn(`⚠️ Finnhub chart fetch failed after ${Date.now() - startTime}ms, falling back to Yahoo Finance:`, error);
      }
    }

    // Fallback to Yahoo Finance
    try {
      const chartData = await this.fetchChartDataFromYahoo(symbol, period);
      const fetchTime = Date.now() - startTime;
      console.log(`✅ Real chart data fetched from Yahoo Finance for ${symbol}: ${chartData.data.length} points (${fetchTime}ms)`);
      this.setCachedData(cacheKey, chartData);
      return chartData;
    } catch (error) {
      console.error('All chart data sources failed:', error);
      throw new Error(`Unable to fetch chart data for ${symbol}. Please check the symbol and try again.`);
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
}

export const stockDataService = StockDataService.getInstance(); 