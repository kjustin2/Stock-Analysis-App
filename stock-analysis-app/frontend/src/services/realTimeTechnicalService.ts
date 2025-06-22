import { TechnicalIndicatorService, TechnicalData } from './technicalIndicatorService';
import { RealTimeDataService, RealTimeUpdate, SubscriptionCallback } from './realTimeDataService';
import { StockDataService, ChartDataPoint } from './stockDataService';
import { cacheService, CacheKeys, CachePriority } from './cacheService';
import { ErrorLogger } from './errors';

export interface RealTimeTechnicalConfig {
  updateInterval: number; // ms between technical indicator updates
  maxHistoryLength: number; // max data points to keep in memory
  enableSmartUpdates: boolean; // only update changed indicators
  batchUpdateThreshold: number; // number of updates before batch processing
}

export interface RealTimeTechnicalData {
  symbol: string;
  lastUpdate: number;
  technicalData: TechnicalData;
  realtimeValues: {
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
    volume: number;
    timestamp: number;
  };
  indicatorUpdates: {
    rsi: number | null;
    macd_line: number | null;
    macd_signal: number | null;
    bollinger_upper: number | null;
    bollinger_middle: number | null;
    bollinger_lower: number | null;
    stochastic_k: number | null;
    stochastic_d: number | null;
  };
}

export interface TechnicalAlerts {
  rsi_oversold: boolean;
  rsi_overbought: boolean;
  macd_bullish_crossover: boolean;
  macd_bearish_crossover: boolean;
  bollinger_breakout_upper: boolean;
  bollinger_breakout_lower: boolean;
  stochastic_oversold: boolean;
  stochastic_overbought: boolean;
}

export type RealTimeTechnicalCallback = (data: RealTimeTechnicalData, alerts: TechnicalAlerts) => void;

export class RealTimeTechnicalService {
  private static instance: RealTimeTechnicalService;
  private config: RealTimeTechnicalConfig;
  private technicalService: TechnicalIndicatorService;
  private realTimeService: RealTimeDataService;
  private stockDataService: StockDataService;
  private errorLogger: ErrorLogger;

  // Data storage for efficient updates
  private symbolData: Map<string, ChartDataPoint[]> = new Map();
  private technicalCache: Map<string, TechnicalData> = new Map();
  private subscribers: Map<string, Set<RealTimeTechnicalCallback>> = new Map();
  private updateQueue: Map<string, RealTimeUpdate[]> = new Map();
  private lastFullUpdate: Map<string, number> = new Map();
  private processingTimers: Map<string, number> = new Map();

  // Performance tracking
  private readonly MAX_QUEUE_SIZE = 10;
  private readonly FULL_RECALC_INTERVAL = 300000; // 5 minutes

  constructor(config?: Partial<RealTimeTechnicalConfig>) {
    this.config = {
      updateInterval: 5000, // 5 seconds
      maxHistoryLength: 1000, // Keep 1000 data points max
      enableSmartUpdates: true,
      batchUpdateThreshold: 3,
      ...config
    };

    this.technicalService = TechnicalIndicatorService.getInstance();
    this.realTimeService = RealTimeDataService.getInstance();
    this.stockDataService = StockDataService.getInstance();
    this.errorLogger = ErrorLogger.getInstance();

    console.log('📊 Real-Time Technical Service initialized');
  }

  public static getInstance(config?: Partial<RealTimeTechnicalConfig>): RealTimeTechnicalService {
    if (!RealTimeTechnicalService.instance) {
      RealTimeTechnicalService.instance = new RealTimeTechnicalService(config);
    }
    return RealTimeTechnicalService.instance;
  }

  /**
   * Subscribe to real-time technical analysis for a symbol
   * This minimizes API calls by reusing existing data and intelligent caching
   */
  public async subscribeToTechnicalUpdates(
    symbol: string, 
    callback: RealTimeTechnicalCallback
  ): Promise<() => void> {
    const cleanSymbol = symbol.toUpperCase();
    
    try {
      // Initialize subscribers set if needed
      if (!this.subscribers.has(cleanSymbol)) {
        this.subscribers.set(cleanSymbol, new Set());
      }
      
      this.subscribers.get(cleanSymbol)!.add(callback);
      
      // Initialize data for this symbol if needed (SMART: only if not cached)
      await this.initializeSymbolData(cleanSymbol);
      
      // Subscribe to real-time price updates (EFFICIENT: reuses existing connections)
      const unsubscribeRealTime = this.realTimeService.subscribe(cleanSymbol, (update) => {
        this.handleRealTimeUpdate(cleanSymbol, update);
      });

      console.log(`📊 Subscribed to real-time technical analysis for ${cleanSymbol}`);

      // Return unsubscribe function
      return () => {
        this.unsubscribeFromTechnicalUpdates(cleanSymbol, callback);
        unsubscribeRealTime();
      };

    } catch (error) {
      this.errorLogger.log(error as Error, 'RealTimeTechnicalService.subscribeToTechnicalUpdates', { symbol: cleanSymbol });
      throw error;
    }
  }

  /**
   * Unsubscribe from technical updates
   */
  public unsubscribeFromTechnicalUpdates(symbol: string, callback: RealTimeTechnicalCallback): void {
    const cleanSymbol = symbol.toUpperCase();
    const subscribers = this.subscribers.get(cleanSymbol);
    
    if (subscribers) {
      subscribers.delete(callback);
      
      // Clean up if no more subscribers
      if (subscribers.size === 0) {
        this.cleanupSymbolData(cleanSymbol);
      }
    }

    console.log(`📊 Unsubscribed from technical analysis for ${cleanSymbol}`);
  }

  /**
   * PERFORMANCE OPTIMIZATION: Initialize symbol data with smart caching
   * Only makes API calls if data is not already cached or stale
   */
  private async initializeSymbolData(symbol: string): Promise<void> {
    try {
      // Check if we have recent cached data first (AVOIDS API CALL)
      const cacheKey = cacheService.keys.chartData(symbol, '1D');
      const cachedChartData = cacheService.get<ChartDataPoint[]>(cacheKey);
      
      if (cachedChartData && cachedChartData.length > 0) {
        console.log(`📊 Using cached chart data for ${symbol} (avoiding API call)`);
        this.symbolData.set(symbol, cachedChartData);
        
        // Check for cached technical data too
        const techCacheKey = `technical_${symbol}`;
        const cachedTechnical = cacheService.get<TechnicalData>(techCacheKey);
        
        if (cachedTechnical) {
          console.log(`📊 Using cached technical data for ${symbol} (avoiding calculation)`);
          this.technicalCache.set(symbol, cachedTechnical);
          this.lastFullUpdate.set(symbol, Date.now());
          return;
        }
      }

      // Only fetch if we don't have cached data (MINIMIZES API CALLS)
      let chartData: ChartDataPoint[];
      
      if (!cachedChartData) {
        console.log(`📊 Fetching fresh chart data for ${symbol} (cache miss)`);
        const stockInfo = await this.stockDataService.getStockInfo(symbol);
        chartData = stockInfo.chartData;
        
        // Cache the fresh data
        cacheService.set(cacheKey, chartData, CachePriority.HIGH, { ttl: 300 }); // 5 min cache
      } else {
        chartData = cachedChartData;
      }

      // Store data and calculate initial technical indicators
      this.symbolData.set(symbol, chartData);
      await this.calculateAndCacheTechnicalData(symbol, chartData);
      
      this.lastFullUpdate.set(symbol, Date.now());

    } catch (error) {
      this.errorLogger.log(error as Error, 'RealTimeTechnicalService.initializeSymbolData', { symbol });
      throw error;
    }
  }

  /**
   * SMART UPDATE: Handle real-time price updates efficiently
   * Uses queuing and batch processing to minimize calculations
   */
  private handleRealTimeUpdate(symbol: string, update: RealTimeUpdate): void {
    try {
      // Add to update queue for batch processing (PERFORMANCE OPTIMIZATION)
      if (!this.updateQueue.has(symbol)) {
        this.updateQueue.set(symbol, []);
      }

      const queue = this.updateQueue.get(symbol)!;
      queue.push(update);

      // Prevent queue overflow
      if (queue.length > this.MAX_QUEUE_SIZE) {
        queue.shift(); // Remove oldest update
      }

      // Process updates in batches or after threshold
      if (queue.length >= this.config.batchUpdateThreshold) {
        this.processBatchUpdates(symbol);
      } else {
        // Schedule batch processing if not already scheduled
        if (!this.processingTimers.has(symbol)) {
          const timer = window.setTimeout(() => {
            this.processBatchUpdates(symbol);
          }, this.config.updateInterval);
          
          this.processingTimers.set(symbol, timer);
        }
      }

    } catch (error) {
      this.errorLogger.log(error as Error, 'RealTimeTechnicalService.handleRealTimeUpdate', { symbol, update });
    }
  }

  /**
   * BATCH PROCESSING: Process multiple updates efficiently
   * This reduces calculation overhead significantly
   */
  private processBatchUpdates(symbol: string): void {
    try {
      const queue = this.updateQueue.get(symbol);
      const timer = this.processingTimers.get(symbol);
      
      if (timer) {
        clearTimeout(timer);
        this.processingTimers.delete(symbol);
      }

      if (!queue || queue.length === 0) return;

      // Get the latest update from the batch
      const latestUpdate = queue[queue.length - 1];
      
      // Clear the processed queue
      this.updateQueue.set(symbol, []);

      // Update chart data with new price point (INCREMENTAL UPDATE)
      this.updateChartDataIncremental(symbol, latestUpdate);

      // Calculate updated technical indicators (SMART: only what changed)
      this.updateTechnicalIndicators(symbol, latestUpdate);

      console.log(`📊 Processed ${queue.length} batched updates for ${symbol}`);

    } catch (error) {
      this.errorLogger.log(error as Error, 'RealTimeTechnicalService.processBatchUpdates', { symbol });
    }
  }

  /**
   * INCREMENTAL UPDATE: Add new price data without full recalculation
   */
  private updateChartDataIncremental(symbol: string, update: RealTimeUpdate): void {
    const existingData = this.symbolData.get(symbol);
    if (!existingData) return;

    // Create new data point from real-time update
    const newDataPoint: ChartDataPoint = {
      x: new Date(update.timestamp).toISOString().split('T')[0],
      o: update.data.current_price, // Use current price as open for real-time
      h: Math.max(existingData[existingData.length - 1]?.h || 0, update.data.current_price),
      l: Math.min(existingData[existingData.length - 1]?.l || Infinity, update.data.current_price),
      c: update.data.current_price,
      v: update.data.volume || 0
    };

    // Check if this is an update to today's data or a new day
    const today = new Date().toISOString().split('T')[0];
    const lastDataPoint = existingData[existingData.length - 1];
    
    if (lastDataPoint && lastDataPoint.x === today) {
      // Update existing today's data point
      lastDataPoint.h = Math.max(lastDataPoint.h, newDataPoint.c);
      lastDataPoint.l = Math.min(lastDataPoint.l, newDataPoint.c);
      lastDataPoint.c = newDataPoint.c;
      lastDataPoint.v = Math.max(lastDataPoint.v, newDataPoint.v);
    } else {
      // Add new data point and maintain max length
      existingData.push(newDataPoint);
      
      if (existingData.length > this.config.maxHistoryLength) {
        existingData.shift(); // Remove oldest data point
      }
    }

    this.symbolData.set(symbol, existingData);
  }

  /**
   * SMART TECHNICAL UPDATE: Only recalculate what's necessary
   */
  private updateTechnicalIndicators(symbol: string, update: RealTimeUpdate): void {
    const chartData = this.symbolData.get(symbol);
    const cachedTechnical = this.technicalCache.get(symbol);
    
    if (!chartData || !cachedTechnical) return;

    const now = Date.now();
    const lastFullUpdate = this.lastFullUpdate.get(symbol) || 0;
    const needsFullRecalc = (now - lastFullUpdate) > this.FULL_RECALC_INTERVAL;

    let updatedTechnical: TechnicalData;

    if (needsFullRecalc) {
      // Full recalculation every 5 minutes for accuracy
      console.log(`📊 Performing full technical recalculation for ${symbol}`);
      updatedTechnical = this.technicalService.calculateTechnicalIndicators(chartData, symbol, '1D');
      this.lastFullUpdate.set(symbol, now);
    } else {
      // INCREMENTAL UPDATE: Only update the latest values (PERFORMANCE BOOST)
      updatedTechnical = this.calculateIncrementalTechnicalUpdate(symbol, chartData, cachedTechnical, update);
    }

    // Cache updated technical data
    this.technicalCache.set(symbol, updatedTechnical);
    cacheService.set(`technical_${symbol}`, updatedTechnical, CachePriority.MEDIUM, { ttl: 60 }); // 1 min cache

    // Generate alerts and notify subscribers
    const alerts = this.generateTechnicalAlerts(updatedTechnical, update);
    const realTimeTechnicalData = this.createRealTimeTechnicalData(symbol, updatedTechnical, update, alerts);
    
    this.notifySubscribers(symbol, realTimeTechnicalData, alerts);
  }

  /**
   * PERFORMANCE OPTIMIZATION: Incremental technical indicator updates
   * Only recalculates the most recent values instead of entire arrays
   */
  private calculateIncrementalTechnicalUpdate(
    symbol: string, 
    chartData: ChartDataPoint[], 
    cachedTechnical: TechnicalData,
    update: RealTimeUpdate
  ): TechnicalData {
    // Create a copy of cached technical data
    const updatedTechnical = { ...cachedTechnical };
    
    // Only update the last few values for real-time responsiveness
    const prices = chartData.map(d => d.c);
    const currentIndicators = this.technicalService.getCurrentIndicatorValues(cachedTechnical);

    // Update only the latest values (MUCH faster than full recalculation)
    const latestIndex = prices.length - 1;
    
    // Quick RSI update (approximate for real-time)
    if (prices.length >= 14) {
      const rsiArray = updatedTechnical.indicators.rsi || [];
      const latestRsi = this.calculateQuickRSI(prices.slice(-15), 14);
      if (rsiArray.length > 0) {
        rsiArray[rsiArray.length - 1] = latestRsi;
      }
      updatedTechnical.indicators.rsi = rsiArray;
    }

    // Quick MACD update
    if (prices.length >= 26) {
      const macdLine = updatedTechnical.indicators.macd_line || [];
      const macdSignal = updatedTechnical.indicators.macd_signal || [];
      
      // Approximate MACD update
      const ema12 = this.calculateQuickEMA(prices.slice(-13), 12);
      const ema26 = this.calculateQuickEMA(prices.slice(-27), 26);
      const newMacdValue = ema12 - ema26;
      
      if (macdLine.length > 0) {
        macdLine[macdLine.length - 1] = newMacdValue;
      }
      
      updatedTechnical.indicators.macd_line = macdLine;
      updatedTechnical.indicators.macd_signal = macdSignal;
    }

    // Update Bollinger Bands (approximate)
    if (prices.length >= 20) {
      const recentPrices = prices.slice(-20);
      const sma = recentPrices.reduce((sum, price) => sum + price, 0) / 20;
      const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);
      
      const bollingerUpper = updatedTechnical.indicators.bollinger_upper || [];
      const bollingerMiddle = updatedTechnical.indicators.bollinger_middle || [];
      const bollingerLower = updatedTechnical.indicators.bollinger_lower || [];
      
      if (bollingerUpper.length > 0) {
        bollingerUpper[bollingerUpper.length - 1] = sma + (2 * stdDev);
        bollingerMiddle[bollingerMiddle.length - 1] = sma;
        bollingerLower[bollingerLower.length - 1] = sma - (2 * stdDev);
      }
      
      updatedTechnical.indicators.bollinger_upper = bollingerUpper;
      updatedTechnical.indicators.bollinger_middle = bollingerMiddle;
      updatedTechnical.indicators.bollinger_lower = bollingerLower;
    }

    return updatedTechnical;
  }

  /**
   * Quick RSI calculation for real-time updates
   */
  private calculateQuickRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50; // Default neutral

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Quick EMA calculation for real-time updates
   */
  private calculateQuickEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  /**
   * Generate technical analysis alerts
   */
  private generateTechnicalAlerts(technicalData: TechnicalData, update: RealTimeUpdate): TechnicalAlerts {
    const currentValues = this.technicalService.getCurrentIndicatorValues(technicalData);
    
    return {
      rsi_oversold: (currentValues.rsi || 50) < 30,
      rsi_overbought: (currentValues.rsi || 50) > 70,
      macd_bullish_crossover: this.detectMACDCrossover(technicalData, 'bullish'),
      macd_bearish_crossover: this.detectMACDCrossover(technicalData, 'bearish'),
      bollinger_breakout_upper: update.data.currentPrice > (currentValues.bollinger_upper || Infinity),
      bollinger_breakout_lower: update.data.currentPrice < (currentValues.bollinger_lower || 0),
      stochastic_oversold: (currentValues.stochastic_k || 50) < 20,
      stochastic_overbought: (currentValues.stochastic_k || 50) > 80
    };
  }

  /**
   * Detect MACD crossovers
   */
  private detectMACDCrossover(technicalData: TechnicalData, type: 'bullish' | 'bearish'): boolean {
    const macdLine = technicalData.indicators.macd_line || [];
    const macdSignal = technicalData.indicators.macd_signal || [];
    
    if (macdLine.length < 2 || macdSignal.length < 2) return false;
    
    const currentMacd = macdLine[macdLine.length - 1];
    const currentSignal = macdSignal[macdSignal.length - 1];
    const prevMacd = macdLine[macdLine.length - 2];
    const prevSignal = macdSignal[macdSignal.length - 2];
    
    if (currentMacd === null || currentSignal === null || prevMacd === null || prevSignal === null) {
      return false;
    }
    
    if (type === 'bullish') {
      return prevMacd <= prevSignal && currentMacd > currentSignal;
    } else {
      return prevMacd >= prevSignal && currentMacd < currentSignal;
    }
  }

  /**
   * Create real-time technical data object
   */
  private createRealTimeTechnicalData(
    symbol: string, 
    technicalData: TechnicalData, 
    update: RealTimeUpdate,
    alerts: TechnicalAlerts
  ): RealTimeTechnicalData {
    const currentValues = this.technicalService.getCurrentIndicatorValues(technicalData);
    
    return {
      symbol,
      lastUpdate: update.timestamp,
      technicalData,
      realtimeValues: {
        currentPrice: update.data.currentPrice,
        priceChange: update.data.change,
        priceChangePercent: update.data.changePercent,
        volume: update.data.volume || 0,
        timestamp: update.timestamp
      },
      indicatorUpdates: {
        rsi: currentValues.rsi,
        macd_line: currentValues.macd_line,
        macd_signal: currentValues.macd_signal,
        bollinger_upper: currentValues.bollinger_upper,
        bollinger_middle: currentValues.bollinger_middle,
        bollinger_lower: currentValues.bollinger_lower,
        stochastic_k: currentValues.stochastic_k,
        stochastic_d: currentValues.stochastic_d
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(symbol: string, data: RealTimeTechnicalData, alerts: TechnicalAlerts): void {
    const subscribers = this.subscribers.get(symbol);
    if (!subscribers) return;

    subscribers.forEach(callback => {
      try {
        callback(data, alerts);
      } catch (error) {
        this.errorLogger.log(error as Error, 'RealTimeTechnicalService.notifySubscribers', { symbol });
      }
    });
  }

  /**
   * Clean up symbol data when no more subscribers
   */
  private cleanupSymbolData(symbol: string): void {
    this.symbolData.delete(symbol);
    this.technicalCache.delete(symbol);
    this.updateQueue.delete(symbol);
    this.lastFullUpdate.delete(symbol);
    
    const timer = this.processingTimers.get(symbol);
    if (timer) {
      clearTimeout(timer);
      this.processingTimers.delete(symbol);
    }

    console.log(`🧹 Cleaned up data for ${symbol}`);
  }

  /**
   * Calculate full technical data and cache it
   */
  private async calculateAndCacheTechnicalData(symbol: string, chartData: ChartDataPoint[]): Promise<void> {
    const technicalData = this.technicalService.calculateTechnicalIndicators(chartData, symbol, '1D');
    this.technicalCache.set(symbol, technicalData);
    
    // Cache for other components to use
    cacheService.set(`technical_${symbol}`, technicalData, CachePriority.MEDIUM, { ttl: 300 }); // 5 min cache
    
    console.log(`📊 Calculated and cached technical indicators for ${symbol}`);
  }

  /**
   * Get current technical data for a symbol (cached)
   */
  public getTechnicalData(symbol: string): TechnicalData | null {
    return this.technicalCache.get(symbol.toUpperCase()) || null;
  }

  /**
   * Force refresh technical data for a symbol
   */
  public async refreshTechnicalData(symbol: string): Promise<void> {
    await this.initializeSymbolData(symbol.toUpperCase());
  }

  /**
   * Get service statistics
   */
  public getStats(): any {
    return {
      trackedSymbols: this.symbolData.size,
      activeSubscribers: Array.from(this.subscribers.entries()).map(([symbol, subs]) => ({
        symbol,
        subscriberCount: subs.size
      })),
      cacheSize: this.technicalCache.size,
      queueSizes: Object.fromEntries(
        Array.from(this.updateQueue.entries()).map(([symbol, queue]) => [symbol, queue.length])
      ),
      memoryUsage: {
        symbolDataSize: this.symbolData.size,
        technicalCacheSize: this.technicalCache.size,
        maxHistoryLength: this.config.maxHistoryLength
      }
    };
  }
}

export default RealTimeTechnicalService; 