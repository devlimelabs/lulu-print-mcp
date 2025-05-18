export interface LogContext {
  scope: string;
  level: 'debug' | 'info' | 'warn' | 'error';
}

export function createLogger(defaultContext: Partial<LogContext> = {}) {
  return {
    debug(message: string, context: Partial<LogContext> = {}) {
      const fullContext = { ...defaultContext, ...context, level: 'debug' as const };
      console.error(`[${fullContext.scope}] [${fullContext.level}] ${message}`);
    },
    
    info(message: string, context: Partial<LogContext> = {}) {
      const fullContext = { ...defaultContext, ...context, level: 'info' as const };
      console.error(`[${fullContext.scope}] [${fullContext.level}] ${message}`);
    },
    
    warn(message: string, context: Partial<LogContext> = {}) {
      const fullContext = { ...defaultContext, ...context, level: 'warn' as const };
      console.error(`[${fullContext.scope}] [${fullContext.level}] ${message}`);
    },
    
    error(message: string, error?: unknown, context: Partial<LogContext> = {}) {
      const fullContext = { ...defaultContext, ...context, level: 'error' as const };
      console.error(`[${fullContext.scope}] [${fullContext.level}] ${message}`);
      if (error) {
        console.error(error);
      }
    }
  };
}