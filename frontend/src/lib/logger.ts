/**
 * Production-Safe Logger
 * 
 * Replaces console.log statements with a configurable logger
 * that can be disabled in production
 */

type LogLevel = 'info' | 'warn' | 'error';

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
      level: 'info',
      production: process.env.NODE_ENV === 'production'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
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
    
    // Handle undefined or null message and args
    const safeMessage = message || 'No message provided';
    
    // More robust argument handling
    const safeArgs = args.map(arg => {
      try {
        if (arg === undefined) return 'undefined';
        if (arg === null) return 'null';
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack?.split('\n').slice(0, 3).join('\n') // Limit stack trace
          };
        }
        if (typeof arg === 'object') {
          // Try to safely stringify objects
          try {
            return JSON.stringify(arg, null, 2);
          } catch (jsonError) {
            return '[Object - unable to serialize]';
          }
        }
        return String(arg);
      } catch (conversionError) {
        return '[Argument - unable to convert]';
      }
    });
    
    try {
      // Use a more robust logging approach
      const logMessage = `${prefix} ${safeMessage}`;
      
      switch (level) {
        case 'info':
          if (safeArgs.length > 0) {
            console.info(logMessage, ...safeArgs);
          } else {
            console.info(logMessage);
          }
          break;
        case 'warn':
          if (safeArgs.length > 0) {
            console.warn(logMessage, ...safeArgs);
          } else {
            console.warn(logMessage);
          }
          break;
        case 'error':
          if (safeArgs.length > 0) {
            console.error(logMessage, ...safeArgs);
          } else {
            console.error(logMessage);
          }
          break;
      }
    } catch (error) {
      // Ultimate fallback - just log the basic message
      try {
        console.log(`[${timestamp}] [FALLBACK] ${safeMessage}`);
      } catch (fallbackError) {
        // If even this fails, we can't do anything more
      }
    }
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
    this.info(`🌐 API ${method}`, url, data ? { data } : '');
  }

  apiResponse(status: number, url: string, data?: unknown): void {
    if (status >= 400) {
      this.error(`💥 API Error ${status}`, url, data);
    } else {
      this.info(`✅ API ${status}`, url);
    }
  }

  // Auth logging
  authAction(action: string, details?: unknown): void {
    this.info(`🔑 Auth: ${action}`, details || '');
  }

  // Safe error logging - handles undefined/null errors
  safeError(message: string, error?: unknown): void {
    try {
      const safeError = error instanceof Error ? (error as any).message : 
                       error ? String(error) : 'Unknown error';
      this.formatMessage('error', message, safeError);
    } catch (logError) {
      // Ultimate fallback - just use console.log
    }
  }

  // API-specific error logging that's extra safe
  apiError(message: string, error?: unknown): void {
    try {
      // Extract only the essential information
      let errorInfo = 'Unknown error';
      
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        const parts = [];
        
        if (errorObj.message) parts.push(`Message: ${errorObj.message}`);
        if (errorObj.status) parts.push(`Status: ${errorObj.status}`);
        if (errorObj.statusText) parts.push(`StatusText: ${errorObj.statusText}`);
        if (errorObj.code) parts.push(`Code: ${errorObj.code}`);
        
        errorInfo = parts.length > 0 ? parts.join(', ') : 'Error object without readable properties';
      } else if (error) {
        errorInfo = String(error);
      }
      
      this.formatMessage('error', message, errorInfo);
    } catch (logError) {
      // Ultimate fallback
      try {
        console.log(`[${new Date().toISOString()}] [ERROR] ${message} - [Error details unavailable]`);
      } catch (fallbackError) {
        // If even this fails, we can't do anything more
      }
    }
  }

  // Navigation logging
  navigation(from: string, to: string): void {
    this.info(`🧭 Navigation: ${from} → ${to}`);
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
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

export default logger;
