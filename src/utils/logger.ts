/**
 * Centralized Logger Utility
 * - Strips debug/info logs in production
 * - Sanitizes sensitive data
 * - Supports UI log capture via callback
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Callback for UI log capture
let logCallback: ((log: { timestamp: string; level: LogLevel; prefix: string; message: string; data?: unknown }) => void) | null = null;

export const setLogCallback = (callback: typeof logCallback) => {
  logCallback = callback;
};

const isProd = import.meta.env.PROD;
const SENSITIVE_KEYS = ['token', 'apikey', 'servicerole', 'password', 'authorization', 'secret'];

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))) {
      (clone as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof (clone as Record<string, unknown>)[key] === 'object') {
      (clone as Record<string, unknown>)[key] = sanitize((clone as Record<string, unknown>)[key]);
    }
  }
  return clone;
}

function log(level: LogLevel, prefix: string, message: string, data?: unknown) {
  // In production, only log warnings and errors
  if (isProd && (level === 'debug' || level === 'info')) {
    // Still fire callback for UI panels even in prod
    if (logCallback) {
      logCallback({ timestamp: new Date().toISOString(), level, prefix, message, data: data ? sanitize(data) : undefined });
    }
    return;
  }

  const ts = new Date().toISOString();
  const sanitized = data ? sanitize(data) : undefined;
  const args = sanitized !== undefined ? [`[${ts}] ${prefix} ${message}`, sanitized] : [`[${ts}] ${prefix} ${message}`];

  if (level === 'error') {
    console.error(...args);
  } else if (level === 'warn') {
    console.warn(...args);
  } else {
    console.log(...args);
  }

  if (logCallback) {
    logCallback({ timestamp: ts, level, prefix, message, data: sanitized });
  }
}

interface Logger {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
  avm: (message: string, data?: unknown) => void;
  db: (message: string, data?: unknown) => void;
  request: (requestId: string, message: string, data?: unknown) => void;
}

export const logger: Logger = {
  info: (message, data?) => log('info', '[COMPS]', message, data),
  warn: (message, data?) => log('warn', '[COMPS]', message, data),
  error: (message, data?) => log('error', '[COMPS]', message, data),
  debug: (message, data?) => log('debug', '[COMPS]', message, data),
  avm: (message, data?) => log('info', '[AVM]', message, data),
  db: (message, data?) => log('info', '[DB]', message, data),
  request: (requestId, message, data?) => log('info', `[REQUEST-${requestId}]`, message, data),
};
