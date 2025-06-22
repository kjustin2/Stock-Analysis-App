import { createRateLimitError } from './errors';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
  backoffMs?: number;
}

export interface RequestQueue {
  symbol: string;
  apiCall: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retryCount: number;
}

export interface ApiLimits {
  [provider: string]: RateLimitConfig;
}

// Default configurations for different providers
export const DEFAULT_LIMITS: ApiLimits = {
  finnhub: {
    maxRequests: 60,     // 60 requests per minute for free tier
    windowMs: 60 * 1000, // 1 minute window
    burstLimit: 5,       // Allow 5 rapid requests
    backoffMs: 1000      // 1 second backoff on limit hit
  },
  yahoo: {
    maxRequests: 120,    // More generous for Yahoo (estimated)
    windowMs: 60 * 1000, // 1 minute window
    burstLimit: 10,      // Allow 10 rapid requests
    backoffMs: 500       // 500ms backoff
  },
  openrouter: {
    maxRequests: 200,    // OpenRouter free tier (estimated)
    windowMs: 60 * 1000, // 1 minute window
    burstLimit: 20,      // Allow 20 rapid requests
    backoffMs: 2000      // 2 second backoff for AI calls
  }
};

export class RateLimiter {
  private static instance: RateLimiter;
  private requestHistory: Map<string, number[]> = new Map();
  private requestQueues: Map<string, RequestQueue[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private limits: ApiLimits;

  constructor(limits: ApiLimits = DEFAULT_LIMITS) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  public static getInstance(limits?: ApiLimits): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(limits);
    }
    return RateLimiter.instance;
  }

  public async executeRequest<T>(
    provider: string,
    symbol: string,
    apiCall: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    const providerConfig = this.limits[provider];
    if (!providerConfig) {
      throw new Error(`No rate limit configuration for provider: ${provider}`);
    }

    // Check if we can execute immediately
    if (this.canExecuteImmediately(provider)) {
      try {
        this.recordRequest(provider);
        const result = await apiCall();
        console.log(`✅ ${provider} request executed immediately for ${symbol}`);
        return result;
      } catch (error) {
        this.handleRequestError(provider, error);
        throw error;
      }
    }

    // Queue the request if rate limited
    return this.queueRequest(provider, symbol, apiCall, priority);
  }

  private canExecuteImmediately(provider: string): boolean {
    const config = this.limits[provider];
    const history = this.getRequestHistory(provider);
    const now = Date.now();
    
    // Clean old requests outside the window
    const validRequests = history.filter(timestamp => 
      now - timestamp < config.windowMs
    );
    
    this.requestHistory.set(provider, validRequests);

    // Check if under the limit
    if (validRequests.length < config.maxRequests) {
      return true;
    }

    // Check burst limit (requests in last 5 seconds)
    const recentRequests = validRequests.filter(timestamp => 
      now - timestamp < 5000
    );
    
    return recentRequests.length < (config.burstLimit || config.maxRequests);
  }

  private async queueRequest<T>(
    provider: string,
    symbol: string,
    apiCall: () => Promise<T>,
    priority: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queueItem: RequestQueue = {
        symbol,
        apiCall,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0
      };

      // Add to queue with priority (higher priority = lower index)
      const queue = this.getQueue(provider);
      const insertIndex = queue.findIndex(item => priority > 0 && item.timestamp > queueItem.timestamp);
      
      if (insertIndex === -1) {
        queue.push(queueItem);
      } else {
        queue.splice(insertIndex, 0, queueItem);
      }

      console.log(`📋 Queued ${provider} request for ${symbol} (queue size: ${queue.length})`);
      
      // Start processing queue if not already processing
      this.processQueue(provider);
    });
  }

  private async processQueue(provider: string): Promise<void> {
    const processingKey = `${provider}_processing`;
    
    if (this.processing.get(processingKey)) {
      return; // Already processing this provider's queue
    }

    this.processing.set(processingKey, true);

    try {
      const queue = this.getQueue(provider);
      const config = this.limits[provider];

      while (queue.length > 0) {
        if (!this.canExecuteImmediately(provider)) {
          // Wait for backoff period
          const backoffMs = config.backoffMs || 1000;
          console.log(`⏳ Rate limited for ${provider}, waiting ${backoffMs}ms...`);
          await this.delay(backoffMs);
          continue;
        }

        const queueItem = queue.shift();
        if (!queueItem) continue;

        try {
          this.recordRequest(provider);
          const result = await queueItem.apiCall();
          console.log(`✅ Queued ${provider} request completed for ${queueItem.symbol}`);
          queueItem.resolve(result);
        } catch (error) {
          await this.handleQueuedRequestError(provider, queueItem, error);
        }

        // Small delay between requests to be respectful
        await this.delay(100);
      }
    } finally {
      this.processing.set(processingKey, false);
    }
  }

  private async handleQueuedRequestError(
    provider: string,
    queueItem: RequestQueue,
    error: any
  ): Promise<void> {
    const config = this.limits[provider];
    const maxRetries = 3;

    // Determine if error is retryable
    const isRetryable = this.isRetryableError(error);
    
    if (isRetryable && queueItem.retryCount < maxRetries) {
      queueItem.retryCount++;
      const retryDelay = this.calculateRetryDelay(queueItem.retryCount);
      
      console.log(`🔄 Retrying ${provider} request for ${queueItem.symbol} (attempt ${queueItem.retryCount}/${maxRetries}) after ${retryDelay}ms`);
      
      // Re-queue with delay
      await this.delay(retryDelay);
      const queue = this.getQueue(provider);
      queue.unshift(queueItem); // Add back to front of queue
    } else {
      console.error(`❌ ${provider} request failed for ${queueItem.symbol} after ${queueItem.retryCount} retries`);
      
      if (this.isRateLimitError(error)) {
        const rateLimitError = createRateLimitError(
          `Rate limit exceeded for ${provider}`,
          provider,
          config.backoffMs,
          { symbol: queueItem.symbol, retryCount: queueItem.retryCount }
        );
        queueItem.reject(rateLimitError);
      } else {
        queueItem.reject(error);
      }
    }
  }

  private handleRequestError(provider: string, error: any): void {
    if (this.isRateLimitError(error)) {
      console.warn(`⚠️ Rate limit hit for ${provider}, future requests will be queued`);
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    // Network errors, timeouts, and 5xx errors are retryable
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    
    if (error.response && error.response.status) {
      return retryableStatusCodes.includes(error.response.status);
    }
    
    // Network errors (ECONNRESET, ETIMEDOUT, etc.)
    if (error.code) {
      const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
      return retryableCodes.includes(error.code);
    }
    
    return false;
  }

  private isRateLimitError(error: any): boolean {
    if (error.response && error.response.status === 429) {
      return true;
    }
    
    const message = error.message?.toLowerCase() || '';
    return message.includes('rate limit') || 
           message.includes('too many requests') ||
           message.includes('quota exceeded');
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
  }

  private recordRequest(provider: string): void {
    const history = this.getRequestHistory(provider);
    history.push(Date.now());
    this.requestHistory.set(provider, history);
  }

  private getRequestHistory(provider: string): number[] {
    return this.requestHistory.get(provider) || [];
  }

  private getQueue(provider: string): RequestQueue[] {
    if (!this.requestQueues.has(provider)) {
      this.requestQueues.set(provider, []);
    }
    return this.requestQueues.get(provider)!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for monitoring
  public getStats(provider: string): {
    requestsInWindow: number;
    queueSize: number;
    isProcessing: boolean;
    nextAvailableSlot: number;
  } {
    const config = this.limits[provider];
    const history = this.getRequestHistory(provider);
    const now = Date.now();
    
    const requestsInWindow = history.filter(timestamp => 
      now - timestamp < config.windowMs
    ).length;
    
    const queueSize = this.getQueue(provider).length;
    const isProcessing = this.processing.get(`${provider}_processing`) || false;
    
    // Calculate when next slot will be available
    const nextAvailableSlot = requestsInWindow >= config.maxRequests
      ? Math.max(0, history[0] + config.windowMs - now)
      : 0;

    return {
      requestsInWindow,
      queueSize,
      isProcessing,
      nextAvailableSlot
    };
  }

  public clearHistory(provider?: string): void {
    if (provider) {
      this.requestHistory.delete(provider);
      this.requestQueues.delete(provider);
    } else {
      this.requestHistory.clear();
      this.requestQueues.clear();
    }
  }

  public updateLimits(provider: string, config: RateLimitConfig): void {
    this.limits[provider] = { ...this.limits[provider], ...config };
  }
} 