import { ErrorLogger, createNetworkError, createDataError, createTimeoutError } from './errors';
import { cacheService, CacheKeys, CachePriority } from './cacheService';
import { StockDataService, StockInfo } from './stockDataService';
import { ServiceHealthTracker } from './serviceHealthTracker';

export interface RealTimeConfig {
  pollingInterval: number; // milliseconds between updates
  symbols: string[]; // symbols to track
  enableWebSocket: boolean; // use WebSocket when available
  maxRetries: number; // max reconnection attempts
  retryDelay: number; // delay between retry attempts
  connectionTimeout: number; // WebSocket connection timeout
  heartbeatInterval: number; // ping interval to keep connection alive
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

export interface ConnectionStatus {
  symbol: string;
  isConnected: boolean;
  connectionType: 'websocket' | 'polling' | 'disconnected';
  lastUpdate: number;
  errorCount: number;
  healthScore: number;
}

export class RealTimeDataService {
  private static instance: RealTimeDataService;
  private config: RealTimeConfig;
  private subscribers: Map<string, Set<SubscriptionCallback>> = new Map();
  private pollingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private retryCounters: Map<string, number> = new Map();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private heartbeatTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private errorLogger: ErrorLogger;
  private stockDataService: StockDataService;
  private healthTracker: ServiceHealthTracker;
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
      connectionTimeout: 15000, // 15 seconds
      heartbeatInterval: 30000, // 30 seconds
      ...config
    };

    this.errorLogger = ErrorLogger.getInstance();
    this.stockDataService = StockDataService.getInstance();
    this.healthTracker = ServiceHealthTracker.getInstance({
      failureThreshold: 3,
      recoveryTimeoutMs: 60000,    // 1 minute for real-time connections
      healthWindowMs: 600000,      // 10 minutes window
      minRequestsForHealth: 3
    });
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

    // Initialize connection status
    this.updateConnectionStatus(symbol, {
      symbol,
      isConnected: false,
      connectionType: 'disconnected',
      lastUpdate: 0,
      errorCount: 0,
      healthScore: 100
    });

    // Check if WebSocket service is available via health tracker
    const wsServiceName = `websocket-${symbol}`;
    if (this.config.enableWebSocket && this.hasApiKey() && this.healthTracker.isServiceAvailable(wsServiceName)) {
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

    // Stop heartbeat
    const heartbeat = this.heartbeatTimers.get(symbol);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeatTimers.delete(symbol);
    }

    // Close WebSocket
    const ws = this.websockets.get(symbol);
    if (ws) {
      ws.close(1000, 'Intentional close'); // Normal closure
      this.websockets.delete(symbol);
    }

    // Reset retry counter and status
    this.retryCounters.delete(symbol);
    this.connectionStatus.delete(symbol);
  }

  private setupWebSocket(symbol: string): void {
    const wsServiceName = `websocket-${symbol}`;
    const startTime = Date.now();
    
    try {
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) {
        console.warn(`⚠️ No API key available for WebSocket, falling back to polling for ${symbol}`);
        this.setupPolling(symbol);
        return;
      }

      console.log(`🔌 Setting up WebSocket connection for ${symbol}`);
      const ws = new WebSocket(`${this.FINNHUB_WS_URL}?token=${apiKey}`);
      this.websockets.set(symbol, ws);

      // Connection timeout handling
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn(`⏰ WebSocket connection timeout for ${symbol}`);
          const timeoutError = createTimeoutError(
            `WebSocket connection timeout for ${symbol}`,
            wsServiceName,
            this.config.connectionTimeout,
            { symbol, wsUrl: this.FINNHUB_WS_URL }
          );
          this.errorLogger.log(timeoutError);
          this.healthTracker.recordFailure(wsServiceName, timeoutError);
          
          ws.close();
          this.setupPolling(symbol);
        }
      }, this.config.connectionTimeout);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        const responseTime = Date.now() - startTime;
        
        console.log(`🔌 WebSocket connected for ${symbol} (${responseTime}ms)`);
        
        // Subscribe to symbol updates
        ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        
        // Record successful connection
        this.healthTracker.recordSuccess(wsServiceName, responseTime);
        this.retryCounters.delete(symbol); // Reset retry counter on success
        
        // Update connection status
        this.updateConnectionStatus(symbol, {
          symbol,
          isConnected: true,
          connectionType: 'websocket',
          lastUpdate: Date.now(),
          errorCount: 0,
          healthScore: this.healthTracker.getHealthMetrics(wsServiceName).healthScore
        });

        // Setup heartbeat to keep connection alive
        this.setupHeartbeat(symbol, ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
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
                
                // Update connection status
                this.updateConnectionStatus(symbol, {
                  symbol,
                  isConnected: true,
                  connectionType: 'websocket',
                  lastUpdate: Date.now(),
                  errorCount: 0,
                  healthScore: this.healthTracker.getHealthMetrics(wsServiceName).healthScore
                });
              }
            }
          } else if (data.type === 'ping') {
            // Respond to ping with pong
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          const dataError = createDataError(
            `Failed to parse WebSocket data for ${symbol}`,
            'finnhub',
            event.data,
            { symbol, error: error instanceof Error ? error.message : String(error) }
          );
          this.errorLogger.log(dataError);
          
          // Increment error count but don't record as service failure
          const status = this.connectionStatus.get(symbol);
          if (status) {
            this.updateConnectionStatus(symbol, { ...status, errorCount: status.errorCount + 1 });
          }
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        const responseTime = Date.now() - startTime;
        
        const networkError = createNetworkError(
          `WebSocket error for ${symbol}`,
          'finnhub',
          error,
          { symbol, wsUrl: this.FINNHUB_WS_URL, responseTime }
        );
        this.errorLogger.log(networkError);
        this.healthTracker.recordFailure(wsServiceName, networkError);
        
        // Update connection status
        const status = this.connectionStatus.get(symbol);
        if (status) {
          this.updateConnectionStatus(symbol, {
            ...status,
            isConnected: false,
            connectionType: 'disconnected',
            errorCount: status.errorCount + 1,
            healthScore: this.healthTracker.getHealthMetrics(wsServiceName).healthScore
          });
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket closed for ${symbol}:`, event.code, event.reason);
        
        this.websockets.delete(symbol);
        
        // Clear heartbeat
        const heartbeat = this.heartbeatTimers.get(symbol);
        if (heartbeat) {
          clearInterval(heartbeat);
          this.heartbeatTimers.delete(symbol);
        }

        // Update connection status
        const status = this.connectionStatus.get(symbol);
        if (status) {
          this.updateConnectionStatus(symbol, {
            ...status,
            isConnected: false,
            connectionType: 'disconnected',
            healthScore: this.healthTracker.getHealthMetrics(wsServiceName).healthScore
          });
        }

        // Attempt to reconnect if still tracking and not intentionally closed
        if (this.isActive && this.subscribers.has(symbol) && event.code !== 1000) {
          this.attemptWebSocketReconnect(symbol);
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const networkError = createNetworkError(
        `Failed to setup WebSocket for ${symbol}`,
        'finnhub',
        error,
        { symbol, responseTime }
      );
      this.errorLogger.log(networkError);
      this.healthTracker.recordFailure(wsServiceName, networkError);
      
      // Fallback to polling
      this.setupPolling(symbol);
    }
  }

  private setupHeartbeat(symbol: string, ws: WebSocket): void {
    const heartbeatTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        // Connection lost, clear heartbeat
        clearInterval(heartbeatTimer);
        this.heartbeatTimers.delete(symbol);
      }
    }, this.config.heartbeatInterval);
    
    this.heartbeatTimers.set(symbol, heartbeatTimer);
    console.log(`💓 Heartbeat setup for ${symbol} (${this.config.heartbeatInterval}ms interval)`);
  }

  private updateConnectionStatus(symbol: string, status: ConnectionStatus): void {
    this.connectionStatus.set(symbol, status);
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
    
    // Update connection status to polling
    this.updateConnectionStatus(symbol, {
      symbol,
      isConnected: true,
      connectionType: 'polling',
      lastUpdate: Date.now(),
      errorCount: 0,
      healthScore: 100 // Polling is always considered healthy
    });
    
    console.log(`⏱️ Polling setup for ${symbol} (${this.config.pollingInterval}ms interval)`);
  }

  private async fetchAndNotify(symbol: string): Promise<void> {
    const status = this.connectionStatus.get(symbol);
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
      
      // Update connection status on successful fetch
      if (status) {
        this.updateConnectionStatus(symbol, {
          ...status,
          lastUpdate: Date.now(),
          errorCount: 0 // Reset error count on success
        });
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch real-time data for ${symbol}:`, error);
      
      // Update error count in connection status
      if (status) {
        this.updateConnectionStatus(symbol, {
          ...status,
          errorCount: status.errorCount + 1
        });
      }
      
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
    const wsServiceName = `websocket-${symbol}`;
    
    // Check if service is available via health tracker
    if (!this.healthTracker.isServiceAvailable(wsServiceName)) {
      console.warn(`❌ WebSocket service ${wsServiceName} circuit breaker is open, falling back to polling`);
      this.setupPolling(symbol);
      return;
    }
    
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
        // Double-check service availability before reconnecting
        if (this.healthTracker.isServiceAvailable(wsServiceName)) {
          this.setupWebSocket(symbol);
        } else {
          console.warn(`❌ WebSocket service ${wsServiceName} became unavailable during retry, falling back to polling`);
          this.setupPolling(symbol);
        }
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

  /**
   * Get connection status for all tracked symbols
   */
  public getConnectionStatus(): ConnectionStatus[] {
    return Array.from(this.connectionStatus.values());
  }

  /**
   * Get connection status for a specific symbol
   */
  public getSymbolConnectionStatus(symbol: string): ConnectionStatus | null {
    return this.connectionStatus.get(symbol.toUpperCase()) || null;
  }

  /**
   * Get WebSocket health metrics
   */
  public getWebSocketHealth(): {
    overall: ReturnType<ServiceHealthTracker['getSystemHealthSummary']>;
    services: Array<{
      name: string;
      status: ReturnType<ServiceHealthTracker['getServiceStatus']>;
    }>;
  } {
    const wsServices = Array.from(this.websockets.keys()).map(symbol => `websocket-${symbol}`);
    return {
      overall: this.healthTracker.getSystemHealthSummary(),
      services: wsServices.map(name => ({
        name,
        status: this.healthTracker.getServiceStatus(name)
      }))
    };
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