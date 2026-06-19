type LogLevel = "info" | "warn" | "error" | "debug";

interface SentryGlobal {
  captureException?: (exception: unknown, hint?: { extra?: Record<string, unknown> }) => void;
}

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  return { details: String(error) };
}

function writeLog(level: LogLevel, message: string, error?: unknown, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === "production";

  const errorData = error ? { error: formatError(error) } : {};
  const logData = {
    timestamp,
    level,
    message,
    ...errorData,
    ...meta,
  };

  // Automatic Sentry capture for warning/error levels in production if configured
  if (level === "error" || level === "warn") {
    const globalSentry = (globalThis as unknown as { Sentry?: SentryGlobal }).Sentry;
    if (globalSentry && typeof globalSentry.captureException === "function") {
      globalSentry.captureException(error || new Error(message), { extra: meta });
    }
  }

  if (isProd) {
    if (level === "error") {
      console.error(JSON.stringify(logData));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logData));
    } else {
      console.log(JSON.stringify(logData));
    }
  } else {
    const errorPrefix = error ? `\nError details: ${error instanceof Error ? error.message : String(error)}` : "";
    const metaPrefix = meta && Object.keys(meta).length > 0 ? `\nMeta: ${JSON.stringify(meta, null, 2)}` : "";
    const prefix = `[${level.toUpperCase()}] [${timestamp}] ${message}${errorPrefix}${metaPrefix}`;

    if (level === "error") {
      console.error(prefix);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    } else if (level === "warn") {
      console.warn(prefix);
    } else {
      console.log(prefix);
    }
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => writeLog("info", message, undefined, meta),
  warn: (message: string, error?: unknown, meta?: Record<string, unknown>) => writeLog("warn", message, error, meta),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => writeLog("error", message, error, meta),
  debug: (message: string, meta?: Record<string, unknown>) => writeLog("debug", message, undefined, meta),
};

