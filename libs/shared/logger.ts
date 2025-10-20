/**
 * Structured Logger Utility
 * Consistent logging format across all microservices
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogContext {
  service?: string;
  userId?: string;
  traceId?: string;
  [key: string]: unknown;
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    const logString = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(logString);
        }
        break;
      default:
        console.log(logString);
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }
}

/**
 * Create a logger instance for a service
 */
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
