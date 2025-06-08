interface LoggerOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  timestamp?: boolean;
}

class Logger {
  private options: LoggerOptions = {
    level: 'info',
    timestamp: true,
  };

  constructor(options?: Partial<LoggerOptions>) {
    this.options = { ...this.options, ...options };
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, error?: any): string {
    const timestamp = this.options.timestamp ? `[${this.getTimestamp()}] ` : '';
    const formattedMessage = `${timestamp}[${level.toUpperCase()}] ${message}`;
    
    if (error) {
      return `${formattedMessage}\n${error instanceof Error ? error.stack : JSON.stringify(error)}`;
    }
    
    return formattedMessage;
  }

  debug(message: string, error?: any): void {
    if (this.options.level === 'debug') {
      console.debug(this.formatMessage('debug', message, error));
    }
  }

  info(message: string, error?: any): void {
    if (['debug', 'info'].includes(this.options.level)) {
      console.info(this.formatMessage('info', message, error));
    }
  }

  warn(message: string, error?: any): void {
    if (['debug', 'info', 'warn'].includes(this.options.level)) {
      console.warn(this.formatMessage('warn', message, error));
    }
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('error', message, error));
  }

  setLevel(level: LoggerOptions['level']): void {
    this.options.level = level;
  }

  setTimestamp(enabled: boolean): void {
    this.options.timestamp = enabled;
  }
}

export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
}); 