// Logging service with context support

interface LoggerOptions {
  context?: Record<string, any>;
}

function createLogger(options: LoggerOptions = {}) {
  const ctx = options.context || {};
  const formatCtx = () => Object.keys(ctx).length ? ` ${JSON.stringify(ctx)}` : '';

  return {
    info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}${formatCtx()}`, ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}${formatCtx()}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}${formatCtx()}`, ...args),
    debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}${formatCtx()}`, ...args),
    exception: (message: string, error: Error, ...args: any[]) => {
      console.error(`[ERROR] ${message}${formatCtx()}`, error.stack || error, ...args);
    },
    child: (childCtx: Record<string, any>) => createLogger({ context: { ...ctx, ...childCtx } }),
  };
}

export const logger = createLogger();
