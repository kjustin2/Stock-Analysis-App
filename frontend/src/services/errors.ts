// Custom Error Types for Stock Analysis App
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_KEY_ERROR = 'API_KEY_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: any;
  context?: Record<string, any>;
  severity: Severity;
  timestamp: string;
  source: string; // 'finnhub', 'yahoo', 'system'
  retryable: boolean;
}

export class StockDataError extends Error {
  public readonly details: ErrorDetails;

  constructor(
    type: ErrorType,
    message: string,
    severity: Severity = Severity.MEDIUM,
    source: string = 'system',
    originalError?: any,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'StockDataError';
    
    this.details = {
      type,
      message,
      originalError,
      context,
      severity,
      timestamp: new Date().toISOString(),
      source,
      retryable: this.isRetryable(type)
    };

    // Stack trace is automatically maintained by Error class
  }

  private isRetryable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        return true;
      case ErrorType.RATE_LIMIT_ERROR:
        return true; // with backoff
      case ErrorType.API_KEY_ERROR:
      case ErrorType.VALIDATION_ERROR:
        return false;
      case ErrorType.DATA_ERROR:
        return false; // data corruption is not retryable
      default:
        return false;
    }
  }

  public toLogFormat(): string {
    return JSON.stringify({
      error: this.name,
      message: this.message,
      details: this.details
    }, null, 2);
  }
}

// Specific Error Classes
export class NetworkError extends StockDataError {
  constructor(message: string, source: string, originalError?: any, context?: Record<string, any>) {
    super(ErrorType.NETWORK_ERROR, message, Severity.MEDIUM, source, originalError, context);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends StockDataError {
  constructor(message: string, source: string, retryAfter?: number, context?: Record<string, any>) {
    super(
      ErrorType.RATE_LIMIT_ERROR,
      message,
      Severity.HIGH,
      source,
      null,
      { ...context, retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends StockDataError {
  constructor(message: string, source: string, invalidData?: any, context?: Record<string, any>) {
    super(
      ErrorType.VALIDATION_ERROR,
      message,
      Severity.MEDIUM,
      source,
      null,
      { ...context, invalidData }
    );
    this.name = 'ValidationError';
  }
}

export class ApiKeyError extends StockDataError {
  constructor(message: string, source: string, context?: Record<string, any>) {
    super(ErrorType.API_KEY_ERROR, message, Severity.CRITICAL, source, null, context);
    this.name = 'ApiKeyError';
  }
}

export class TimeoutError extends StockDataError {
  constructor(message: string, source: string, timeoutMs: number, context?: Record<string, any>) {
    super(
      ErrorType.TIMEOUT_ERROR,
      message,
      Severity.MEDIUM,
      source,
      null,
      { ...context, timeoutMs }
    );
    this.name = 'TimeoutError';
  }
}

export class DataError extends StockDataError {
  constructor(message: string, source: string, invalidData?: any, context?: Record<string, any>) {
    super(
      ErrorType.DATA_ERROR,
      message,
      Severity.HIGH,
      source,
      null,
      { ...context, invalidData }
    );
    this.name = 'DataError';
  }
}

// Error Logger
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorDetails[] = [];
  private readonly MAX_LOGS = 100;

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  public log(error: StockDataError): void {
    this.logs.unshift(error.details);
    
    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Log to console based on severity
    switch (error.details.severity) {
      case Severity.CRITICAL:
        console.error('🚨 CRITICAL:', error.toLogFormat());
        break;
      case Severity.HIGH:
        console.error('🔥 HIGH:', error.message, error.details);
        break;
      case Severity.MEDIUM:
        console.warn('⚠️ MEDIUM:', error.message, error.details);
        break;
      case Severity.LOW:
        console.info('ℹ️ LOW:', error.message);
        break;
    }
  }

  public getRecentErrors(count: number = 10): ErrorDetails[] {
    return this.logs.slice(0, count);
  }

  public getErrorsBySource(source: string): ErrorDetails[] {
    return this.logs.filter(log => log.source === source);
  }

  public getRetryableErrors(): ErrorDetails[] {
    return this.logs.filter(log => log.retryable);
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

// Utility Functions
export function createNetworkError(
  message: string,
  source: string,
  originalError?: any,
  context?: Record<string, any>
): NetworkError {
  return new NetworkError(message, source, originalError, context);
}

export function createRateLimitError(
  message: string,
  source: string,
  retryAfter?: number,
  context?: Record<string, any>
): RateLimitError {
  return new RateLimitError(message, source, retryAfter, context);
}

export function createValidationError(
  message: string,
  source: string,
  invalidData?: any,
  context?: Record<string, any>
): ValidationError {
  return new ValidationError(message, source, invalidData, context);
}

export function createApiKeyError(
  message: string,
  source: string,
  context?: Record<string, any>
): ApiKeyError {
  return new ApiKeyError(message, source, context);
}

export function createTimeoutError(
  message: string,
  source: string,
  timeoutMs: number,
  context?: Record<string, any>
): TimeoutError {
  return new TimeoutError(message, source, timeoutMs, context);
}

export function createDataError(
  message: string,
  source: string,
  invalidData?: any,
  context?: Record<string, any>
): DataError {
  return new DataError(message, source, invalidData, context);
} 