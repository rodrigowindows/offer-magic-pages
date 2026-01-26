// src/utils/logger.ts

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isProd = process.env.NODE_ENV === 'production';
const SENSITIVE_KEYS = ['token', 'apiKey', 'serviceRole', 'password', 'Authorization'];

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object') {
      clone[key] = sanitize(clone[key]);
    }
  }
  return clone;
}

function log(level: LogLevel, prefix: string, message: string, data?: any) {
  if (isProd && level === 'debug') return; // Não logar debug em produção
  const ts = new Date().toISOString();
  const sanitized = data ? sanitize(data) : undefined;
  if (level === 'error') {
    console.error(`[${ts}] ${prefix} ${message}`, sanitized);
  } else if (level === 'warn') {
    console.warn(`[${ts}] ${prefix} ${message}`, sanitized);
  } else {
    console.log(`[${ts}] ${prefix} ${message}`, sanitized);
  }
}

interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
  avm: (message: string, data?: any) => void;
  db: (message: string, data?: any) => void;
  request: (requestId: string, message: string, data?: any) => void;
}

export const logger: Logger = {
  info: (message: string, data?: any) => log('info', '[COMPS]', message, data),
  warn: (message: string, data?: any) => log('warn', '[COMPS]', message, data),
  error: (message: string, data?: any) => log('error', '[COMPS]', message, data),
  debug: (message: string, data?: any) => log('debug', '[COMPS]', message, data),
  avm: (message: string, data?: any) => log('info', '[AVM]', message, data),
  db: (message: string, data?: any) => log('info', '[DB]', message, data),
  request: (requestId: string, message: string, data?: any) => log('info', `[REQUEST-${requestId}]`, message, data),
};
