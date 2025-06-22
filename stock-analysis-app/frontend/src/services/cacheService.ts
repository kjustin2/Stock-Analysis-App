import { ErrorLogger, createDataError } from './errors';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
  priority: CachePriority;
}

export enum CachePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface CacheConfig {
  maxSize: number; // Max cache size in MB
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionThreshold: number; // Compress entries larger than this (bytes)
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  totalSize: number; // in bytes
  hitRate: number;
  memoryUsage: number; // in MB
  oldestEntry: number;
  newestEntry: number;
}

export class AdvancedCacheService {
  private static instance: AdvancedCacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: number | null = null;
  private errorLogger: ErrorLogger;

  // TTL configurations for different data types
  private readonly TTL_CONFIG = {
    realtime: 2 * 60 * 1000,      // 2 minutes for real-time quotes
    chart_1d: 5 * 60 * 1000,      // 5 minutes for 1-day charts
    chart_5d: 15 * 60 * 1000,     // 15 minutes for 5-day charts
    chart_1m: 60 * 60 * 1000,     // 1 hour for 1-month charts
    chart_1y: 4 * 60 * 60 * 1000, // 4 hours for 1-year charts
    company_info: 24 * 60 * 60 * 1000, // 24 hours for company info
    technical_indicators: 10 * 60 * 1000, // 10 minutes for technical indicators
  };

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 50, // 50MB default
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      cleanupInterval: 60 * 1000, // 1 minute cleanup
      compressionThreshold: 10 * 1024, // 10KB
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      totalSize: 0,
      hitRate: 0,
      memoryUsage: 0,
      oldestEntry: Date.now(),
      newestEntry: Date.now()
    };

    this.errorLogger = ErrorLogger.getInstance();
    this.startCleanupTimer();
  }

  public static getInstance(config?: Partial<CacheConfig>): AdvancedCacheService {
    if (!AdvancedCacheService.instance) {
      AdvancedCacheService.instance = new AdvancedCacheService(config);
    }
    return AdvancedCacheService.instance;
  }

  public set<T>(
    key: string,
    data: T,
    ttl?: number,
    priority: CachePriority = CachePriority.MEDIUM
  ): boolean {
    try {
      const estimatedSize = this.estimateSize(data);
      const now = Date.now();

      // Check if we need to make space
      if (this.shouldEvict(estimatedSize)) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        accessCount: 0,
        lastAccessed: now,
        size: estimatedSize,
        priority
      };

      // Remove old entry if exists to update stats
      if (this.cache.has(key)) {
        const oldEntry = this.cache.get(key)!;
        this.stats.totalSize -= oldEntry.size;
        this.stats.entries--;
      }

      this.cache.set(key, entry);
      this.stats.totalSize += estimatedSize;
      this.stats.entries++;
      this.stats.newestEntry = now;
      this.updateMemoryUsage();

      console.log(`📦 Cached ${key} (${this.formatSize(estimatedSize)}, TTL: ${ttl || this.getTTLForKey(key)}ms)`);
      return true;
    } catch (error) {
      const cacheError = createDataError(
        `Failed to cache data for key: ${key}`,
        'cache',
        { key, error: error instanceof Error ? error.message : String(error) }
      );
      this.errorLogger.log(cacheError);
      return false;
    }
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    const ttl = this.getTTLForKey(key);
    
    // Check if entry has expired
    if (now - entry.timestamp > ttl) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      console.log(`⏰ Cache expired for ${key}`);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();

    console.log(`✅ Cache hit for ${key} (accessed ${entry.accessCount} times)`);
    return entry.data as T;
  }

  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.totalSize -= entry.size;
      this.stats.entries--;
      this.updateMemoryUsage();
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  public clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      totalSize: 0,
      hitRate: 0,
      memoryUsage: 0,
      oldestEntry: Date.now(),
      newestEntry: Date.now()
    };
    console.log('🧹 Cache cleared');
  }

  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const ttl = this.getTTLForKey(key);
    return Date.now() - entry.timestamp <= ttl;
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public getDetailedStats(): any {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      accessCount: entry.accessCount,
      size: this.formatSize(entry.size),
      priority: CachePriority[entry.priority],
      expired: now - entry.timestamp > this.getTTLForKey(key)
    }));

    return {
      ...this.stats,
      memoryUsageMB: this.stats.memoryUsage,
      config: this.config,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount) // Most accessed first
    };
  }

  private getTTLForKey(key: string): number {
    // Determine TTL based on key patterns
    if (key.includes('_realtime_') || key.includes('_quote_')) {
      return this.TTL_CONFIG.realtime;
    } else if (key.includes('_chart_1d_')) {
      return this.TTL_CONFIG.chart_1d;
    } else if (key.includes('_chart_5d_')) {
      return this.TTL_CONFIG.chart_5d;
    } else if (key.includes('_chart_1m_')) {
      return this.TTL_CONFIG.chart_1m;
    } else if (key.includes('_chart_1y_')) {
      return this.TTL_CONFIG.chart_1y;
    } else if (key.includes('_company_')) {
      return this.TTL_CONFIG.company_info;
    } else if (key.includes('_indicators_')) {
      return this.TTL_CONFIG.technical_indicators;
    }
    
    return this.config.defaultTTL;
  }

  private shouldEvict(newEntrySize: number): boolean {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    return this.stats.totalSize + newEntrySize > maxSizeBytes;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let lowestPriority = CachePriority.CRITICAL;

    // Find the least recently used entry with lowest priority
    for (const [key, entry] of this.cache.entries()) {
      if (entry.priority < lowestPriority || 
          (entry.priority === lowestPriority && entry.lastAccessed < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.lastAccessed;
        lowestPriority = entry.priority;
      }
    }

    if (oldestKey) {
      console.log(`🗑️ Evicting LRU entry: ${oldestKey} (priority: ${CachePriority[lowestPriority]})`);
      this.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const ttl = this.getTTLForKey(key);
      if (now - entry.timestamp > ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleanup removed ${expiredKeys.length} expired entries`);
    }
  }

  private estimateSize(data: any): number {
    try {
      return new TextEncoder().encode(JSON.stringify(data)).length;
    } catch {
      // Fallback estimation
      return JSON.stringify(data).length * 2; // Rough UTF-16 estimation
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateMemoryUsage(): void {
    this.stats.memoryUsage = this.stats.totalSize / (1024 * 1024);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const cacheService = AdvancedCacheService.getInstance();

// Helper functions for different cache key types
export const CacheKeys = {
  stockInfo: (symbol: string) => `stock_info_realtime_${symbol}`,
  chartData: (symbol: string, period: string) => `chart_data_${period}_${symbol}`,
  companyProfile: (symbol: string) => `company_profile_${symbol}`,
  technicalIndicators: (symbol: string, indicator: string) => `indicators_${indicator}_${symbol}`,
}; 