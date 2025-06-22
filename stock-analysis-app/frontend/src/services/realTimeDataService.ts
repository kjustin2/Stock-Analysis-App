import { ErrorLogger, createNetworkError, createDataError } from './errors';
import { cacheService, CacheKeys, CachePriority } from './cacheService';
import { StockDataService, StockInfo } from './stockDataService';

export interface RealTimeConfig {
  pollingInterval: number; // milliseconds between updates
  symbols: string[]; // symbols to track
  enableWebSocket: boolean; // use WebSocket when available
  maxRetries: number; // max reconnection attempts
  retryDelay: number; // delay between retry attempts
}

export interface RealTimeUpdate {
  symbol: string;
  data: StockInfo;
  timestamp: number;
  source: 'polling' | 'websocket' | 'cache';
}

export interface SubscriptionCallback {
  (update: RealTimeUpdate): void;
}

export class RealTimeDataService {
  private static instance: RealTimeDataService;
  private config: RealTimeConfig;
  private subscribers: Map<string, Set<SubscriptionCallback>> = new Map();
  private pollingTimers: Map<string, number> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private retryCounters: Map<string, number> = new Map();
  private errorLogger: ErrorLogger;
  private stockDataService: StockDataService;
  private isActive: boolean = false;

  // Finnhub WebSocket URL for real-time data
  private readonly FINNHUB_WS_URL = 'wss://ws.finnhub.io';

  constructor(config?: Partial<RealTimeConfig>) {
    this.config = {
      pollingInterval: 10000, // 10 seconds default
      symbols: [],
      enableWebSocket: true,
      maxRetries: 5,
      retryDelay: 2000, // 2 seconds
      ...config
    };

    this.errorLogger = ErrorLogger.getInstance();
    this.stockDataService = StockDataService.getInstance();
  }

  public static getInstance(config?: Partial<RealTimeConfig>): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService(config);
    }
    return RealTimeDataService.instance;
  }

  /**
   * Subscribe to real-time updates for a specific symbol
   */
  public subscribe(symbol: string, callback: SubscriptionCallback): () => void {
    const cleanSymbol = symbol.toUpperCase();
    
    if (!this.subscribers.has(cleanSymbol)) {
      this.subscribers.set(cleanSymbol, new Set());
    }
    
    this.subscribers.get(cleanSymbol)!.add(callback);
    
    // Start tracking this symbol if not already
    if (!this.config.symbols.includes(cleanSymbol)) {
      this.config.symbols.push(cleanSymbol);
      this.startTracking(cleanSymbol);
    }

    console.log(`📡 Subscribed to real-time updates for ${cleanSymbol}`);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(cleanSymbol, callback);
    };
  }

  /**
   * Unsubscribe from real-time updates
   */
  public unsubscribe(symbol: string, callback: SubscriptionCallback): void {
    const cleanSymbol = symbol.toUpperCase();
    const subscribers = this.subscribers.get(cleanSymbol);
    
    if (subscribers) {
      subscribers.delete(callback);
      
      // If no more subscribers, stop tracking
      if (subscribers.size === 0) {
        this.stopTracking(cleanSymbol);
        this.subscribers.delete(cleanSymbol);
        this.config.symbols = this.config.symbols.filter(s => s !== cleanSymbol);
      }
    }

    console.log(`📡 Unsubscribed from ${cleanSymbol}`);
  }

  /**
   * Start the real-time data service
   */
  public start(): void {
    if (this.isActive) {
      console.log('⚡ Real-time service already active');
      return;
    }

    this.isActive = true;
    console.log('⚡ Starting real-time data service');

    // Start tracking all configured symbols
    this.config.symbols.forEach(symbol => {
      this.startTracking(symbol);
    });
  }

  /**
   * Stop the real-time data service
   */
  public stop(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    console.log('⏹️ Stopping real-time data service');

    // Stop all tracking
    this.config.symbols.forEach(symbol => {
      this.stopTracking(symbol);
    });

    // Clear all timers and connections
    this.pollingTimers.clear();
    this.websockets.clear();
    this.retryCounters.clear();
  }

  /**
   * Force refresh of all tracked symbols
   */
  public async refreshAll(): Promise<void> {
    const promises = this.config.symbols.map(symbol => this.fetchAndNotify(symbol));
    await Promise.allSettled(promises);
  }

  /**
   * Get current statistics
   */
  public getStats(): any {
    return {
      isActive: this.isActive,
      trackedSymbols: this.config.symbols.length,
      activeSubscriptions: Array.from(this.subscribers.entries()).map(([symbol, subs]) => ({
        symbol,
        subscriberCount: subs.size
      })),
      activePolling: this.pollingTimers.size,
      activeWebSockets: this.websockets.size,
      retryCounters: Object.fromEntries(this.retryCounters)
    };
  }

  private startTracking(symbol: string): void {
    if (!this.isActive) return;

    console.log(`🎯 Starting real-time tracking for ${symbol}`);

    // Try WebSocket first if available and API key exists
    if (this.config.enableWebSocket && this.hasApiKey()) {
      this.setupWebSocket(symbol);
    } else {
      // Fallback to polling
      this.setupPolling(symbol);
    }

    // Initial fetch
    this.fetchAndNotify(symbol);
  }

  private stopTracking(symbol: string): void {
    console.log(`🛑 Stopping real-time tracking for ${symbol}`);

    // Stop polling
    const timer = this.pollingTimers.get(symbol);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(symbol);
    }

    // Close WebSocket
    const ws = this.websockets.get(symbol);
    if (ws) {
      ws.close();
      this.websockets.delete(symbol);
    }

    // Reset retry counter
    this.retryCounters.delete(symbol);
  }

  private setupWebSocket(symbol: string): void {
    try {
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) {
        console.warn(`⚠️ No API key available for WebSocket, falling back to polling for ${symbol}`);
        this.setupPolling(symbol);
        return;
      }

      const ws = new WebSocket(`${this.FINNHUB_WS_URL}?token=${apiKey}`);
      this.websockets.set(symbol, ws);

      ws.onopen = () => {
        console.log(`🔌 WebSocket connected for ${symbol}`);
        // Subscribe to symbol updates
        ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        this.retryCounters.delete(symbol); // Reset retry counter on success
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'trade' && data.data) {
            // Convert Finnhub WebSocket format to our StockInfo format
            for (const trade of data.data) {
              if (trade.s === symbol) {
                const stockInfo: StockInfo = {
                  symbol: trade.s,
                  name: trade.s, // WebSocket doesn't provide company name
                  current_price: trade.p,
                  previous_close: 0 // Will be filled from cache or API
                };

                const update: RealTimeUpdate = {
                  symbol: trade.s,
                  data: stockInfo,
                  timestamp: trade.t || Date.now(),
                  source: 'websocket'
                };

                this.notifySubscribers(symbol, update);
                // Update cache with high priority
                cacheService.set(CacheKeys.stockInfo(symbol), stockInfo, undefined, CachePriority.CRITICAL);
              }
            }
          }
        } catch (error) {
          const dataError = createDataError(
            `Failed to parse WebSocket data for ${symbol}`,
            'finnhub',
            event.data,
            { symbol, error: error instanceof Error ? error.message : String(error) }
          );
          this.errorLogger.log(dataError);
        }
      };

      ws.onerror = (error) => {
        const networkError = createNetworkError(
          `WebSocket error for ${symbol}`,
          'finnhub',
          error,
          { symbol, wsUrl: this.FINNHUB_WS_URL }
        );
        this.errorLogger.log(networkError);
      };

      ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed for ${symbol}:`, event.code, event.reason);
        this.websockets.delete(symbol);

        // Attempt to reconnect if still tracking and not intentionally closed
        if (this.isActive && this.subscribers.has(symbol) && event.code !== 1000) {
          this.attemptWebSocketReconnect(symbol);
        }
      };
    } catch (error) {
      const networkError = createNetworkError(
        `Failed to setup WebSocket for ${symbol}`,
        'finnhub',
        error,
        { symbol }
      );
      this.errorLogger.log(networkError);
      
      // Fallback to polling
      this.setupPolling(symbol);
    }
  }

  private setupPolling(symbol: string): void {
    // Clear any existing timer
    const existingTimer = this.pollingTimers.get(symbol);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      if (this.isActive && this.subscribers.has(symbol)) {
        this.fetchAndNotify(symbol);
      }
    }, this.config.pollingInterval);

    this.pollingTimers.set(symbol, timer);
    console.log(`⏱️ Polling setup for ${symbol} (${this.config.pollingInterval}ms interval)`);
  }

  private async fetchAndNotify(symbol: string): Promise<void> {
    try {
      console.log(`🔄 Fetching real-time data for ${symbol}`);
      const stockInfo = await this.stockDataService.getStockInfo(symbol);
      
      const update: RealTimeUpdate = {
        symbol,
        data: stockInfo,
        timestamp: Date.now(),
        source: 'polling'
      };

      this.notifySubscribers(symbol, update);
    } catch (error) {
      console.warn(`⚠️ Failed to fetch real-time data for ${symbol}:`, error);
      
      // Try to get cached data as fallback
      const cachedData = cacheService.get<StockInfo>(CacheKeys.stockInfo(symbol));
      if (cachedData) {
        const update: RealTimeUpdate = {
          symbol,
          data: cachedData,
          timestamp: Date.now(),
          source: 'cache'
        };
        this.notifySubscribers(symbol, update);
      }
    }
  }

  private notifySubscribers(symbol: string, update: RealTimeUpdate): void {
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error(`Error in subscriber callback for ${symbol}:`, error);
        }
      });
    }
  }

  private attemptWebSocketReconnect(symbol: string): void {
    const retryCount = this.retryCounters.get(symbol) || 0;
    
    if (retryCount >= this.config.maxRetries) {
      console.warn(`❌ Max WebSocket reconnection attempts reached for ${symbol}, falling back to polling`);
      this.setupPolling(symbol);
      return;
    }

    this.retryCounters.set(symbol, retryCount + 1);
    const delay = this.config.retryDelay * Math.pow(2, retryCount); // Exponential backoff

    console.log(`🔄 Attempting WebSocket reconnection for ${symbol} (attempt ${retryCount + 1}/${this.config.maxRetries}) in ${delay}ms`);

    setTimeout(() => {
      if (this.isActive && this.subscribers.has(symbol)) {
        this.setupWebSocket(symbol);
      }
    }, delay);
  }

  private hasApiKey(): boolean {
    return !!import.meta.env.VITE_FINNHUB_API_KEY;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RealTimeConfig>): void {
    const oldSymbols = [...this.config.symbols];
    this.config = { ...this.config, ...newConfig };

    // Restart tracking if symbols changed and service is active
    if (this.isActive) {
      const symbolsToStop = oldSymbols.filter(s => !this.config.symbols.includes(s));
      const symbolsToStart = this.config.symbols.filter(s => !oldSymbols.includes(s));

      symbolsToStop.forEach(symbol => this.stopTracking(symbol));
      symbolsToStart.forEach(symbol => this.startTracking(symbol));
    }
  }
}

// Export singleton instance
export const realTimeDataService = RealTimeDataService.getInstance();

// Helper hooks for React components
export function useRealTimeStock(_symbol: string): {
  data: StockInfo | null;
  isLive: boolean;
  lastUpdate: number | null;
  source: string | null;
} {
  // This would be implemented as a React hook in a full implementation
  // For now, we'll just return a basic interface
  return {
    data: null,
    isLive: false,
    lastUpdate: null,
    source: null
  };
} 