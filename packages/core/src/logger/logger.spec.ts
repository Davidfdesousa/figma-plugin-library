import { describe, expect, it, vi } from 'vitest';

import { createLogger, redact } from './index';

describe('redact', () => {
  it('masks sensitive keys case-insensitively', () => {
    const result = redact({ Token: 'abc123', name: 'ok' }) as Record<string, unknown>;
    expect(result.Token).toBe('[redacted]');
    expect(result.name).toBe('ok');
  });

  it('redacts nested objects and arrays', () => {
    const result = redact({
      user: { password: 'hunter2', id: '1' },
      history: [{ secret: 'x' }, { note: 'y' }],
    }) as {
      user: { password: string; id: string };
      history: [{ secret: string }, { note: string }];
    };
    expect(result.user.password).toBe('[redacted]');
    expect(result.user.id).toBe('1');
    expect(result.history[0].secret).toBe('[redacted]');
    expect(result.history[1].note).toBe('y');
  });

  it('handles circular references without throwing', () => {
    const obj: Record<string, unknown> = { name: 'a' };
    obj.self = obj;
    expect(() => redact(obj)).not.toThrow();
    const result = redact(obj) as Record<string, unknown>;
    expect(result.self).toBe('[circular]');
  });

  it('passes through primitives untouched', () => {
    expect(redact('hello')).toBe('hello');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
  });
});

describe('createLogger', () => {
  it('suppresses messages below minLevel', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = createLogger({ name: 'test', minLevel: 'warn' });
    logger.debug('should not log');
    logger.info('should not log either');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs messages at or above minLevel, redacting sensitive data', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = createLogger({ name: 'test' });
    logger.error('failed', { token: 'secret-value' });
    expect(spy).toHaveBeenCalledWith('[test] [error]', 'failed', { token: '[redacted]' });
    spy.mockRestore();
  });
});
