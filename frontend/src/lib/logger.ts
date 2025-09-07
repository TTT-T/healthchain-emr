/**
 * Production-Safe Logger
 * 
 * Replaces console.log statements with a configurable logger
 * that can be disabled in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  production: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production',
      level: 'debug',
      production: process.env.NODE_ENV === 'production'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage('error', message, ...args);
  }

  // Convenience method for console.log replacement
  log(message: string, ...args: unknown[]): void {
    this.info(message, ...args);
  }

  // API request logging
  apiRequest(method: string, url: string, data?: unknown): void {
    this.debug(`🌐 API ${method}`, url, data ? { data } : '');
  }

  apiResponse(status: number, url: string, data?: unknown): void {
    if (status >= 400) {
      this.error(`💥 API Error ${status}`, url, data);
    } else {
      this.debug(`✅ API ${status}`, url);
    }
  }

  // Auth logging
  authAction(action: string, details?: unknown): void {
    this.info(`🔑 Auth: ${action}`, details || '');
  }

  // Navigation logging
  navigation(from: string, to: string): void {
    this.debug(`🧭 Navigation: ${from} → ${to}`);
  }

  // Configuration
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const log = logger.log.bind(logger);
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

export default logger;
