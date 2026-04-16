import { getRequestContext } from './request-context';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  locale?: string;
  error?: { message: string; stack?: string };
  [key: string]: unknown;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function buildEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown,
): LogEntry {
  const reqCtx = getRequestContext();
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...reqCtx,
    ...context,
  };

  if (error) {
    if (error instanceof Error) {
      entry.error = { message: error.message, stack: error.stack };
    } else {
      entry.error = { message: String(error) };
    }
  }

  return entry;
}

function emit(entry: LogEntry): void {
  const json = JSON.stringify(entry);
  if (entry.level === 'error' || entry.level === 'warn') {
    console.error(json);
  } else {
    console.log(json);
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('debug')) return;
    emit(buildEntry('debug', message, context));
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('info')) return;
    emit(buildEntry('info', message, context));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (!shouldLog('warn')) return;
    emit(buildEntry('warn', message, context));
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (!shouldLog('error')) return;
    emit(buildEntry('error', message, context, error));
  },
};
