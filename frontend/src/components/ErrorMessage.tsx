import React from 'react';
import { StockDataError, ErrorType, Severity } from '../services/errors';

interface ErrorMessageProps {
  error: string | Error | StockDataError | null;
  symbol?: string;
  onRetry?: () => void;
  onClear?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  error, 
  symbol, 
  onRetry, 
  onClear 
}) => {
  if (!error) return null;

  const parseError = (err: string | Error | StockDataError) => {
    // Handle StockDataError with detailed information
    if (err && typeof err === 'object' && 'details' in err) {
      const stockError = err as StockDataError;
      return {
        type: stockError.details.type,
        severity: stockError.details.severity,
        source: stockError.details.source,
        retryable: stockError.details.retryable,
        message: stockError.message,
        context: stockError.details.context
      };
    }

    // Handle regular Error objects
    if (err instanceof Error) {
      return {
        type: ErrorType.NETWORK_ERROR,
        severity: Severity.MEDIUM,
        source: 'system',
        retryable: true,
        message: err.message,
        context: {}
      };
    }

    // Handle string errors
    return {
      type: ErrorType.NETWORK_ERROR,
      severity: Severity.MEDIUM,
      source: 'system',
      retryable: true,
      message: typeof err === 'string' ? err : 'An unknown error occurred',
      context: {}
    };
  };

  const errorInfo = parseError(error);

  const getUserFriendlyMessage = () => {
    const symbolText = symbol ? ` for ${symbol}` : '';
    
    switch (errorInfo.type) {
      case ErrorType.API_KEY_ERROR:
        return {
          title: '🔑 API Configuration Issue',
          message: `Unable to connect to our data provider${symbolText}. This is a temporary configuration issue.`,
          suggestion: 'Please try again in a few moments, or contact support if the issue persists.',
          showRetry: false
        };

      case ErrorType.RATE_LIMIT_ERROR:
        return {
          title: '⏱️ Too Many Requests',
          message: `We're receiving data too quickly from our provider${symbolText}. This helps ensure stable service for everyone.`,
          suggestion: 'Please wait a moment and try again. The limit resets automatically.',
          showRetry: true
        };

      case ErrorType.VALIDATION_ERROR:
        if (errorInfo.source === 'system' && symbol) {
          return {
            title: '❓ Invalid Stock Symbol',
            message: `"${symbol}" doesn't appear to be a valid stock symbol.`,
            suggestion: 'Please check the spelling or try a different symbol (e.g., AAPL, GOOGL, MSFT).',
            showRetry: false
          };
        }
        return {
          title: '⚠️ Data Validation Issue',
          message: `The data received${symbolText} doesn't meet our quality standards.`,
          suggestion: 'This usually resolves itself. Please try again or contact support.',
          showRetry: true
        };

      case ErrorType.TIMEOUT_ERROR:
        return {
          title: '⏰ Connection Timeout',
          message: `Our data provider is taking longer than usual to respond${symbolText}.`,
          suggestion: 'This is usually temporary. Please try again in a moment.',
          showRetry: true
        };

      case ErrorType.DATA_ERROR:
        return {
          title: '📊 Data Quality Issue',
          message: `We received incomplete or corrupted data${symbolText}.`,
          suggestion: 'Our backup systems will try to provide alternative data. Please try again.',
          showRetry: true
        };

      case ErrorType.NETWORK_ERROR:
      default:
        if (errorInfo.message.includes('All data sources failed')) {
          return {
            title: '🌐 Connection Issue',
            message: `Unable to reach our data providers${symbolText}. This might be a temporary network issue.`,
            suggestion: 'Please check your internet connection and try again. We use multiple data sources for reliability.',
            showRetry: true
          };
        }
        return {
          title: '🔄 Connection Problem',
          message: `Having trouble connecting to our data services${symbolText}.`,
          suggestion: 'This is usually temporary. Please try again in a moment.',
          showRetry: true
        };
    }
  };

  const friendlyError = getUserFriendlyMessage();

  const getSeverityStyles = () => {
    switch (errorInfo.severity) {
      case Severity.CRITICAL:
        return {
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          color: '#721c24'
        };
      case Severity.HIGH:
        return {
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          color: '#856404'
        };
      case Severity.MEDIUM:
        return {
          backgroundColor: '#d1ecf1',
          borderColor: '#bee5eb',
          color: '#0c5460'
        };
      case Severity.LOW:
      default:
        return {
          backgroundColor: '#e2e3e5',
          borderColor: '#d6d8db',
          color: '#383d41'
        };
    }
  };

  return (
    <div 
      style={{
        padding: '16px',
        margin: '16px 0',
        border: '1px solid',
        borderRadius: '8px',
        ...getSeverityStyles()
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
            {friendlyError.title}
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            {friendlyError.message}
          </p>
          <p style={{ margin: '0', fontSize: '13px', opacity: 0.8 }}>
            {friendlyError.suggestion}
          </p>
          
          {/* Show technical details for developers */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                Developer Info
              </summary>
              <pre style={{ 
                fontSize: '10px', 
                backgroundColor: 'rgba(0,0,0,0.1)', 
                padding: '8px', 
                borderRadius: '4px',
                margin: '8px 0 0 0'
              }}>
                Type: {errorInfo.type}
                {'\n'}Source: {errorInfo.source}
                {'\n'}Retryable: {errorInfo.retryable}
                {'\n'}Context: {JSON.stringify(errorInfo.context, null, 2)}
              </pre>
            </details>
          )}
        </div>
        
        <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onClear && (
            <button
              onClick={onClear}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
              title="Dismiss this error"
            >
              ✕
            </button>
          )}
          {friendlyError.showRetry && onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage; 