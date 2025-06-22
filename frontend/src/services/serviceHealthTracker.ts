export interface ServiceHealthMetrics {
  successCount: number;
  failureCount: number;
  totalRequests: number;
  lastSuccessTime: number;
  lastFailureTime: number;
  averageResponseTime: number;
  consecutiveFailures: number;
  healthScore: number; // 0-100, calculated based on recent performance
}

export interface CircuitBreakerState {
  isOpen: boolean;
  lastFailureTime: number;
  nextRetryTime: number;
  failureThreshold: number;
  timeoutMs: number;
}

export interface ServiceHealthConfig {
  failureThreshold: number;    // Consecutive failures before circuit opens
  recoveryTimeoutMs: number;   // How long to wait before trying again
  healthWindowMs: number;      // Time window for calculating health score
  minRequestsForHealth: number; // Minimum requests before health scoring
}

const DEFAULT_HEALTH_CONFIG: ServiceHealthConfig = {
  failureThreshold: 3,
  recoveryTimeoutMs: 30000,    // 30 seconds
  healthWindowMs: 300000,      // 5 minutes
  minRequestsForHealth: 5
};

export class ServiceHealthTracker {
  private static instance: ServiceHealthTracker;
  private healthMetrics: Map<string, ServiceHealthMetrics> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private config: ServiceHealthConfig;
  private requestHistory: Map<string, { timestamp: number; success: boolean; responseTime: number }[]> = new Map();

  constructor(config: ServiceHealthConfig = DEFAULT_HEALTH_CONFIG) {
    this.config = { ...DEFAULT_HEALTH_CONFIG, ...config };
  }

  public static getInstance(config?: ServiceHealthConfig): ServiceHealthTracker {
    if (!ServiceHealthTracker.instance) {
      ServiceHealthTracker.instance = new ServiceHealthTracker(config);
    }
    return ServiceHealthTracker.instance;
  }

  /**
   * Check if a service is available (circuit breaker is closed)
   */
  public isServiceAvailable(serviceName: string): boolean {
    const state = this.circuitBreakers.get(serviceName);
    if (state && state.isOpen) {
      if (Date.now() > state.nextRetryTime) {
        // Allow one retry (half-open state)
        return true; 
      }
      return false;
    }
    return true;
  }

  /**
   * Record a successful request
   */
  public recordSuccess(serviceName: string, responseTime: number): void {
    const metrics = this.getHealthMetrics(serviceName);
    const now = Date.now();
    
    // Update metrics
    metrics.successCount++;
    metrics.totalRequests++;
    metrics.lastSuccessTime = now;
    metrics.consecutiveFailures = 0;
    
    // Update average response time
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (metrics.totalRequests - 1)) + responseTime
    ) / metrics.totalRequests;
    
    // Record in history
    this.recordRequestHistory(serviceName, now, true, responseTime);
    
    // Close circuit breaker if it was open
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    if (circuitBreaker.isOpen) {
      circuitBreaker.isOpen = false;
      circuitBreaker.failureThreshold = this.config.failureThreshold;
    }
    
    // Update health score
    this.updateHealthScore(serviceName);
  }

  /**
   * Record a failed request
   */
  public recordFailure(serviceName: string, error?: any): void {
    const metrics = this.getHealthMetrics(serviceName);
    const now = Date.now();
    
    // Update metrics
    metrics.failureCount++;
    metrics.totalRequests++;
    metrics.lastFailureTime = now;
    metrics.consecutiveFailures++;
    
    // Record in history
    this.recordRequestHistory(serviceName, now, false, 0);
    
    // Check if circuit breaker should open
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    if (metrics.consecutiveFailures >= this.config.failureThreshold && !circuitBreaker.isOpen) {
      circuitBreaker.isOpen = true;
      circuitBreaker.lastFailureTime = now;
      circuitBreaker.nextRetryTime = now + this.config.recoveryTimeoutMs;
    }
    
    // Update health score
    this.updateHealthScore(serviceName);
  }

  /**
   * Get current health metrics for a service
   */
  public getHealthMetrics(serviceName: string): ServiceHealthMetrics {
    if (!this.healthMetrics.has(serviceName)) {
      this.healthMetrics.set(serviceName, {
        successCount: 0,
        failureCount: 0,
        totalRequests: 0,
        lastSuccessTime: 0,
        lastFailureTime: 0,
        averageResponseTime: 0,
        consecutiveFailures: 0,
        healthScore: 100 // Start optimistic
      });
    }
    return this.healthMetrics.get(serviceName)!;
  }

  /**
   * Get circuit breaker state for a service
   */
  public getCircuitBreaker(serviceName: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        isOpen: false,
        lastFailureTime: 0,
        nextRetryTime: 0,
        failureThreshold: this.config.failureThreshold,
        timeoutMs: this.config.recoveryTimeoutMs
      });
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Get service status for display/monitoring
   */
  public getServiceStatus(serviceName: string): {
    isAvailable: boolean;
    healthScore: number;
    metrics: ServiceHealthMetrics;
    circuitBreaker: CircuitBreakerState;
    recommendation: string;
  } {
    const metrics = this.getHealthMetrics(serviceName);
    const circuitBreaker = this.getCircuitBreaker(serviceName);
    const isAvailable = this.isServiceAvailable(serviceName);
    
    let recommendation = '';
    if (circuitBreaker.isOpen) {
      const timeUntilRetry = Math.max(0, circuitBreaker.nextRetryTime - Date.now());
      recommendation = `Service temporarily disabled. Retry in ${Math.ceil(timeUntilRetry / 1000)}s`;
    } else if (metrics.healthScore < 50) {
      recommendation = 'Service experiencing issues. Consider using alternatives.';
    } else if (metrics.healthScore < 80) {
      recommendation = 'Service performance degraded. Monitor closely.';
    } else {
      recommendation = 'Service operating normally.';
    }
    
    return {
      isAvailable,
      healthScore: metrics.healthScore,
      metrics,
      circuitBreaker,
      recommendation
    };
  }

  /**
   * Get ordered list of services by health score (best first)
   */
  public getServicesByHealth(): Array<{ serviceName: string; healthScore: number; isAvailable: boolean }> {
    const services: Array<{ serviceName: string; healthScore: number; isAvailable: boolean }> = [];
    
    for (const [serviceName] of this.healthMetrics) {
      const metrics = this.getHealthMetrics(serviceName);
      const isAvailable = this.isServiceAvailable(serviceName);
      services.push({
        serviceName,
        healthScore: metrics.healthScore,
        isAvailable
      });
    }
    
    // Sort by health score (descending) and availability
    return services.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1; // Available services first
      }
      return b.healthScore - a.healthScore; // Higher health score first
    });
  }

  private recordRequestHistory(serviceName: string, timestamp: number, success: boolean, responseTime: number): void {
    if (!this.requestHistory.has(serviceName)) {
      this.requestHistory.set(serviceName, []);
    }
    
    const history = this.requestHistory.get(serviceName)!;
    history.push({ timestamp, success, responseTime });
    
    // Keep only recent history within the health window
    const cutoffTime = timestamp - this.config.healthWindowMs;
    const recentHistory = history.filter(record => record.timestamp >= cutoffTime);
    this.requestHistory.set(serviceName, recentHistory);
  }

  private updateHealthScore(serviceName: string): void {
    const metrics = this.getHealthMetrics(serviceName);
    const history = this.requestHistory.get(serviceName) || [];
    
    if (history.length < this.config.minRequestsForHealth) {
      metrics.healthScore = 100; // Not enough data, stay optimistic
      return;
    }
    
    const now = Date.now();
    const recentHistory = history.filter(record => 
      now - record.timestamp <= this.config.healthWindowMs
    );
    
    if (recentHistory.length === 0) {
      metrics.healthScore = 100;
      return;
    }
    
    // Calculate success rate
    const successRate = recentHistory.filter(record => record.success).length / recentHistory.length;
    
    // Calculate response time factor (faster = better)
    const avgResponseTime = recentHistory
      .filter(record => record.success && record.responseTime > 0)
      .reduce((sum, record) => sum + record.responseTime, 0) / 
      Math.max(1, recentHistory.filter(record => record.success).length);
    
    const responseTimeFactor = Math.max(0, 1 - (avgResponseTime / 10000)); // Penalize if > 10s
    
    // Calculate recency factor (recent activity is more important)
    const timeSinceLastSuccess = metrics.lastSuccessTime > 0 ? now - metrics.lastSuccessTime : Infinity;
    const recencyFactor = Math.max(0, 1 - (timeSinceLastSuccess / this.config.healthWindowMs));
    
    // Combine factors for health score
    metrics.healthScore = Math.round(
      (successRate * 0.6 + responseTimeFactor * 0.2 + recencyFactor * 0.2) * 100
    );
    
    // Ensure bounds
    metrics.healthScore = Math.max(0, Math.min(100, metrics.healthScore));
  }

  /**
   * Reset health metrics for a service (useful for testing)
   */
  public resetServiceHealth(serviceName: string): void {
    this.healthMetrics.delete(serviceName);
    this.circuitBreakers.delete(serviceName);
    this.requestHistory.delete(serviceName);
  }

  /**
   * Get overall system health summary
   */
  public getSystemHealthSummary(): {
    totalServices: number;
    availableServices: number;
    averageHealthScore: number;
    worstService: string | null;
    bestService: string | null;
  } {
    const services = this.getServicesByHealth();
    
    if (services.length === 0) {
      return {
        totalServices: 0,
        availableServices: 0,
        averageHealthScore: 100,
        worstService: null,
        bestService: null
      };
    }
    
    const availableServices = services.filter(s => s.isAvailable).length;
    const averageHealthScore = services.reduce((sum, s) => sum + s.healthScore, 0) / services.length;
    
    return {
      totalServices: services.length,
      availableServices,
      averageHealthScore: Math.round(averageHealthScore),
      worstService: services[services.length - 1]?.serviceName || null,
      bestService: services[0]?.serviceName || null
    };
  }
} 