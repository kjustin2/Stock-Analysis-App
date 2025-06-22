import { TechnicalIndicatorService, TechnicalData } from './technicalIndicatorService';
import { RealTimeDataService, RealTimeUpdate, SubscriptionCallback } from './realTimeDataService';
import { StockDataService, ChartDataPoint, StockInfo } from './stockDataService';
import { cacheService, CachePriority } from './cacheService';
import { ErrorLogger, createDataError } from './errors';

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
  private processingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

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
    const cleanSymbol = symbol.trim().toUpperCase();
    
    try {
      // Initialize data if not present
      if (!this.symbolData.has(cleanSymbol)) {
        await this.initializeSymbolData(cleanSymbol);
      }
      
      // Add subscriber
      if (!this.subscribers.has(cleanSymbol)) {
        this.subscribers.set(cleanSymbol, new Set());
      }
      this.subscribers.get(cleanSymbol)!.add(callback);

      // Subscribe to real-time price updates (EFFICIENT: reuses existing connections)
      const unsubscribeRealTime = this.realTimeService.subscribe(cleanSymbol, (update) => {
        this.handleRealTimeUpdate(cleanSymbol, update);
      });

      // Return unsubscribe function
      return () => {
        this.unsubscribeFromTechnicalUpdates(cleanSymbol, callback);
        unsubscribeRealTime();
      };

    } catch (error) {
      const technicalError = createDataError(
        `Failed to subscribe to technical updates for ${cleanSymbol}: ${error instanceof Error ? error.message : String(error)}`,
        'realtime-technical',
        { symbol: cleanSymbol, error }
      );
      this.errorLogger.log(technicalError);
      throw error;
    }
  }

  /**
   * Unsubscribe from technical updates
   */
  public unsubscribeFromTechnicalUpdates(symbol: string, callback: RealTimeTechnicalCallback): void {
    const cleanSymbol = symbol.trim().toUpperCase();
    const callbacks = this.subscribers.get(cleanSymbol);
    
    if (callbacks) {
      callbacks.delete(callback);
      
      // Clean up if no more subscribers
      if (callbacks.size === 0) {
        this.cleanupSymbolData(cleanSymbol);
      }
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION: Initialize symbol data with smart caching
   * Only makes API calls if data is not already cached or stale
   */
  private async initializeSymbolData(symbol: string): Promise<void> {
    try {
      // Try to get from cache first to avoid API call
      const cachedChart = this.stockDataService.cache.get<ChartData>(
        `${symbol}-${this.config.maxHistoryLength > 365 ? '5y' : '1y'}`
      );
      if (cachedChart) {
        this.symbolData.set(symbol, cachedChart.data);
        if (cachedChart.technicalData) {
          this.technicalCache.set(symbol, cachedChart.technicalData);
        }
        this.lastFullUpdate.set(symbol, Date.now());
        return;
      }

      // console.log(`📊 Fetching fresh chart data for ${symbol} (cache miss)`);
      const stockData = await this.stockDataService.getChartData(
        symbol,
        this.config.maxHistoryLength > 365 ? '5y' : '1y' // Fetch appropriate range
      );
      const chartData = stockData.data;
      
      // Cache the fresh data
      cacheService.set(`chartData_${symbol}_1D`, chartData, 300000, CachePriority.HIGH); // 5 min cache

      // Store data and calculate initial technical indicators
      this.symbolData.set(symbol, chartData);
      await this.calculateAndCacheTechnicalData(symbol, chartData);
      
      this.lastFullUpdate.set(symbol, Date.now());

    } catch (error) {
      const initError = createDataError(
        `Failed to initialize symbol data for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        'realtime-technical',
        { symbol, error }
      );
      this.errorLogger.log(initError);
      throw error;
    }
  }

  /**
   * Handle incoming real-time price updates
   */
  private handleRealTimeUpdate(symbol: string, update: RealTimeUpdate): void {
    try {
      // Queue the update for batch processing (PERFORMANCE: reduces CPU usage)
      if (!this.updateQueue.has(symbol)) {
        this.updateQueue.set(symbol, []);
      }
      
      const queue = this.updateQueue.get(symbol)!;
      queue.push(update);
      
      // Prevent queue overflow
      if (queue.length > this.MAX_QUEUE_SIZE) {
        queue.shift();
      }

      // Batch process updates to reduce calculations
      if (queue.length >= this.config.batchUpdateThreshold) {
        this.processBatchUpdates(symbol);
      } else {
        // Schedule delayed processing if not enough updates
        const existingTimer = this.processingTimers.get(symbol);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        const timer = setTimeout(() => {
          if (this.updateQueue.get(symbol)?.length) {
            this.processBatchUpdates(symbol);
          }
        }, this.config.updateInterval);
        
        this.processingTimers.set(symbol, timer);
      }

    } catch (error) {
      const updateError = createDataError(
        `Failed to handle real-time update for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        'realtime-technical',
        { symbol, update, error }
      );
      this.errorLogger.log(updateError);
    }
  }

  /**
   * Process batched updates efficiently
   */
  private processBatchUpdates(symbol: string): void {
    try {
      const queue = this.updateQueue.get(symbol);
      if (!queue || queue.length === 0) return;

      // Get the most recent update (others are just noise for technical analysis)
      const latestUpdate = queue[queue.length - 1];
      queue.length = 0; // Clear queue

      // Clear any pending timer
      const timer = this.processingTimers.get(symbol);
      if (timer) {
        clearTimeout(timer);
        this.processingTimers.delete(symbol);
      }

      // Update chart data and recalculate technical indicators
      this.updateChartDataIncremental(symbol, latestUpdate);
      this.updateTechnicalIndicators(symbol, latestUpdate);

    } catch (error) {
      const batchError = createDataError(
        `Failed to process batch updates for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        'realtime-technical',
        { symbol, error }
      );
      this.errorLogger.log(batchError);
    }
  }

  /**
   * Update chart data incrementally with new price point
   */
  private updateChartDataIncremental(symbol: string, update: RealTimeUpdate): void {
    const chartData = this.symbolData.get(symbol);
    if (!chartData) return;

    // Create new data point from real-time update
    const newDataPoint: ChartDataPoint = {
      x: new Date(update.timestamp).toISOString(),
      o: update.data.current_price, // Use current price as open for real-time
      h: Math.max(update.data.current_price, chartData[chartData.length - 1]?.h || 0),
      l: Math.min(update.data.current_price, chartData[chartData.length - 1]?.l || Infinity),
      c: update.data.current_price,
      v: 0 // Volume data not available in real-time update
    };

    // Update or add the latest data point
    if (chartData.length > 0) {
      const lastPoint = chartData[chartData.length - 1];
      const currentDate = new Date(update.timestamp).toDateString();
      const lastDate = new Date(lastPoint.x).toDateString();
      
      if (currentDate === lastDate) {
        // Update existing point for same day
        lastPoint.h = Math.max(lastPoint.h, newDataPoint.c);
        lastPoint.l = Math.min(lastPoint.l, newDataPoint.c);
        lastPoint.c = newDataPoint.c;
      } else {
        // Add new point for new day
        chartData.push(newDataPoint);
      }
    } else {
      chartData.push(newDataPoint);
    }

    // Limit history to prevent memory issues
    if (chartData.length > this.config.maxHistoryLength) {
      chartData.shift();
    }
  }

  /**
   * Update technical indicators with real-time data
   */
  private updateTechnicalIndicators(symbol: string, update: RealTimeUpdate): void {
    const chartData = this.symbolData.get(symbol);
    const cachedTechnical = this.technicalCache.get(symbol);
    
    if (!chartData || !cachedTechnical) return;

    // Full recalc if it's been a while or not enabled
    if (
      !this.config.enableSmartUpdates || 
      !this.lastFullUpdate.has(symbol) || 
      (Date.now() - this.lastFullUpdate.get(symbol)!) > this.FULL_RECALC_INTERVAL
    ) {
      // console.log(`🔄 Full technical recalculation for ${symbol}`);
      this.updateTechnicalIndicators(symbol, update);
      this.lastFullUpdate.set(symbol, Date.now());
    } else {
      // Incremental update for better performance
      let updatedTechnical: TechnicalData;
      updatedTechnical = this.calculateIncrementalTechnicalUpdate(
        symbol, 
        chartData, 
        cachedTechnical, 
        update
      );

      // Cache updated technical data
      this.technicalCache.set(symbol, updatedTechnical);
      cacheService.set(`technical_${symbol}`, updatedTechnical, 60000, CachePriority.MEDIUM); // 1 min cache

      // Generate alerts
      const alerts = this.generateTechnicalAlerts(updatedTechnical, update);

      // Create complete real-time technical data
      const realTimeTechnicalData = this.createRealTimeTechnicalData(
        symbol, 
        updatedTechnical, 
        update, 
        alerts
      );

      // Notify all subscribers
      this.notifySubscribers(symbol, realTimeTechnicalData, alerts);
    }
  }

  /**
   * Calculate incremental technical updates for performance
   */
  private calculateIncrementalTechnicalUpdate(
    symbol: string, 
    chartData: ChartDataPoint[], 
    cachedTechnical: TechnicalData,
    update: RealTimeUpdate
  ): TechnicalData {
    // For MVP, we'll do a simplified incremental update
    // In production, this would use more sophisticated algorithms

    const prices = chartData.map(d => d.c);
    const volumes = chartData.map(d => d.v);
    const currentPrice = update.data.current_price;

    // Simple RSI update (last 14 periods)
    let updatedRSI = cachedTechnical.indicators.rsi || [];
    if (prices.length >= 14) {
      const recent14 = [...prices.slice(-13), currentPrice];
      const newRSI = this.calculateQuickRSI(recent14, 14);
      // Update the last value or add new value
      if (updatedRSI.length > 0) {
        updatedRSI[updatedRSI.length - 1] = newRSI;
      } else {
        updatedRSI = [newRSI];
      }
    }

    // Simple EMA update (more responsive to recent changes)
    const ema12 = cachedTechnical.indicators.ema_12 || [];
    const ema26 = cachedTechnical.indicators.ema_26 || [];
    
    const lastEma12 = ema12.length > 0 ? ema12[ema12.length - 1] : currentPrice;
    const lastEma26 = ema26.length > 0 ? ema26[ema26.length - 1] : currentPrice;
    
    const smoothing = 2;
    const updatedEMA12 = lastEma12 ? (currentPrice * (smoothing / 13)) + (lastEma12 * (1 - (smoothing / 13))) : currentPrice;
    const updatedEMA26 = lastEma26 ? (currentPrice * (smoothing / 27)) + (lastEma26 * (1 - (smoothing / 27))) : currentPrice;

    // Update EMA arrays
    const newEma12 = [...ema12];
    const newEma26 = [...ema26];
    if (newEma12.length > 0) {
      newEma12[newEma12.length - 1] = updatedEMA12;
    } else {
      newEma12.push(updatedEMA12);
    }
    if (newEma26.length > 0) {
      newEma26[newEma26.length - 1] = updatedEMA26;
    } else {
      newEma26.push(updatedEMA26);
    }

    // Update other indicators with cached values (or calculate if needed)
    return {
      ...cachedTechnical,
      indicators: {
        ...cachedTechnical.indicators,
        rsi: updatedRSI,
        ema_12: newEma12,
        ema_26: newEma26,
        // Keep other indicators from cache for performance
        // Full recalc will happen every 5 minutes anyway
      }
    };
  }

  /**
   * Quick RSI calculation for incremental updates
   */
  private calculateQuickRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50; // Neutral if insufficient data

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Quick EMA calculation for incremental updates
   */
  private calculateQuickEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Generate technical alerts based on current data
   */
  private generateTechnicalAlerts(technicalData: TechnicalData, update: RealTimeUpdate): TechnicalAlerts {
    const getLatestValue = (array: (number | null)[] | undefined): number | null => {
      if (!array || array.length === 0) return null;
      return array[array.length - 1];
    };

    const currentValues = {
      rsi: getLatestValue(technicalData.indicators.rsi),
      macd_line: getLatestValue(technicalData.indicators.macd_line),
      macd_signal: getLatestValue(technicalData.indicators.macd_signal),
      bollinger_upper: getLatestValue(technicalData.indicators.bollinger_upper),
      bollinger_lower: getLatestValue(technicalData.indicators.bollinger_lower),
      stochastic_k: getLatestValue(technicalData.indicators.stochastic_k),
    };

    return {
      rsi_oversold: (currentValues.rsi || 50) < 30,
      rsi_overbought: (currentValues.rsi || 50) > 70,
      macd_bullish_crossover: this.detectMACDCrossover(technicalData, 'bullish'),
      macd_bearish_crossover: this.detectMACDCrossover(technicalData, 'bearish'),
      bollinger_breakout_upper: update.data.current_price > (currentValues.bollinger_upper || Infinity),
      bollinger_breakout_lower: update.data.current_price < (currentValues.bollinger_lower || 0),
      stochastic_oversold: (currentValues.stochastic_k || 50) < 20,
      stochastic_overbought: (currentValues.stochastic_k || 50) > 80,
    };
  }

  /**
   * Detect MACD crossover signals
   */
  private detectMACDCrossover(technicalData: TechnicalData, type: 'bullish' | 'bearish'): boolean {
    const macdLine = technicalData.indicators.macd_line;
    const macdSignal = technicalData.indicators.macd_signal;
    
    if (!macdLine || !macdSignal || macdLine.length < 2 || macdSignal.length < 2) return false;

    // Get latest values
    const currentMacd = macdLine[macdLine.length - 1];
    const currentSignal = macdSignal[macdSignal.length - 1];
    
    if (currentMacd === null || currentSignal === null) return false;
    
    if (type === 'bullish') {
      // MACD line crosses above signal line
      return currentMacd > currentSignal && Math.abs(currentMacd - currentSignal) < 0.1;
    } else {
      // MACD line crosses below signal line
      return currentMacd < currentSignal && Math.abs(currentMacd - currentSignal) < 0.1;
    }
  }

  /**
   * Create comprehensive real-time technical data object
   */
  private createRealTimeTechnicalData(
    symbol: string, 
    technicalData: TechnicalData, 
    update: RealTimeUpdate,
    alerts: TechnicalAlerts
  ): RealTimeTechnicalData {
    const getLatestValue = (array: (number | null)[] | undefined): number | null => {
      if (!array || array.length === 0) return null;
      return array[array.length - 1];
    };

    return {
      symbol,
      lastUpdate: update.timestamp,
      technicalData,
      realtimeValues: {
        currentPrice: update.data.current_price,
        priceChange: 0, // Would need previous close to calculate
        priceChangePercent: 0, // Would need previous close to calculate
        volume: 0, // Volume not available in real-time update
        timestamp: update.timestamp,
      },
      indicatorUpdates: {
        rsi: getLatestValue(technicalData.indicators.rsi),
        macd_line: getLatestValue(technicalData.indicators.macd_line),
        macd_signal: getLatestValue(technicalData.indicators.macd_signal),
        bollinger_upper: getLatestValue(technicalData.indicators.bollinger_upper),
        bollinger_middle: getLatestValue(technicalData.indicators.bollinger_middle),
        bollinger_lower: getLatestValue(technicalData.indicators.bollinger_lower),
        stochastic_k: getLatestValue(technicalData.indicators.stochastic_k),
        stochastic_d: getLatestValue(technicalData.indicators.stochastic_d),
      },
    };
  }

  /**
   * Notify all subscribers of technical data updates
   */
  private notifySubscribers(symbol: string, data: RealTimeTechnicalData, alerts: TechnicalAlerts): void {
    const subscribers = this.subscribers.get(symbol);
    if (!subscribers || subscribers.size === 0) return;

    try {
      subscribers.forEach(callback => {
        try {
          callback(data, alerts);
        } catch (error) {
          console.warn(`📊 Subscriber callback error for ${symbol}:`, error);
        }
      });
    } catch (error) {
      const notifyError = createDataError(
        `Failed to notify subscribers for ${symbol}: ${error instanceof Error ? error.message : String(error)}`,
        'realtime-technical',
        { symbol, error }
      );
      this.errorLogger.log(notifyError);
    }
  }

  /**
   * Clean up data for a symbol
   */
  private cleanupSymbolData(symbol: string): void {
    this.symbolData.delete(symbol);
    this.technicalCache.delete(symbol);
    this.subscribers.delete(symbol);
    this.updateQueue.delete(symbol);
    this.lastFullUpdate.delete(symbol);
    if(this.processingTimers.has(symbol)){
      clearTimeout(this.processingTimers.get(symbol)!);
      this.processingTimers.delete(symbol);
    }
  }

  /**
   * Calculate and cache technical data for a symbol
   */
  private async calculateAndCacheTechnicalData(symbol: string, chartData: ChartDataPoint[]): Promise<void> {
    const technicalData = this.technicalService.calculateTechnicalIndicators(
      chartData,
      symbol,
      '1D'
    );
    
    this.technicalCache.set(symbol, technicalData);
    cacheService.set(`technical_${symbol}`, technicalData, 300000, CachePriority.MEDIUM); // 5 min cache
  }

  /**
   * Get cached technical data for a symbol
   */
  public getTechnicalData(symbol: string): TechnicalData | null {
    return this.technicalCache.get(symbol.toUpperCase()) || null;
  }

  /**
   * Force refresh technical data for a symbol
   */
  public async refreshTechnicalData(symbol: string): Promise<void> {
    const cleanSymbol = symbol.toUpperCase();
    await this.initializeSymbolData(cleanSymbol);
  }

  /**
   * Get service statistics
   */
  public getStats(): any {
    return {
      activeSymbols: this.symbolData.size,
      totalSubscribers: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      queuedUpdates: Array.from(this.updateQueue.values()).reduce((sum, queue) => sum + queue.length, 0),
      cacheSize: this.technicalCache.size,
      config: this.config
    };
  }
}

export default RealTimeTechnicalService; 