/**
 * Logger utility that automatically disables console methods in production
 * Use this instead of console.log/error/warn for better performance
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // In production, you might want to send errors to an error tracking service
    // Example: Sentry.captureException(args[0]);
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
  
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
  
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

// Override global console in production (optional, more aggressive approach)
if (typeof window !== 'undefined' && !isDevelopment) {
  // Only override in browser environment and production
  window.console = {
    ...window.console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    // Keep error for critical issues, but you can disable it too
    // error: () => {},
  } as Console;
}

