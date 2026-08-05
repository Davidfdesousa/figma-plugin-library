export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const DEFAULT_SENSITIVE_KEYS = [
  'token',
  'password',
  'secret',
  'authorization',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
];

export interface LoggerOptions {
  readonly name: string;
  readonly minLevel?: LogLevel;
  /** Object keys (case-insensitive) whose values get replaced with `[redacted]`. */
  readonly sensitiveKeys?: readonly string[];
}

export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export function redact(
  value: unknown,
  sensitiveKeys: readonly string[] = DEFAULT_SENSITIVE_KEYS,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  seen.add(value);

  const normalizedKeys = sensitiveKeys.map((key) => key.toLowerCase());

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, sensitiveKeys, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = normalizedKeys.includes(key.toLowerCase())
      ? '[redacted]'
      : redact(val, sensitiveKeys, seen);
  }
  return result;
}

export function createLogger(options: LoggerOptions): Logger {
  const minLevel = options.minLevel ?? 'info';
  const sensitiveKeys = options.sensitiveKeys ?? DEFAULT_SENSITIVE_KEYS;

  function log(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const prefix = `[${options.name}] [${level}]`;
    const consoleMethod = level === 'debug' ? 'log' : level;
    if (data === undefined) {
      console[consoleMethod](prefix, message);
    } else {
      console[consoleMethod](prefix, message, redact(data, sensitiveKeys));
    }
  }

  return {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
  };
}
