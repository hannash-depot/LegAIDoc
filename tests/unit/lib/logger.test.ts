import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock request-context before importing logger
vi.mock('@/lib/request-context', () => ({
  getRequestContext: vi.fn(() => undefined),
}));

import { logger } from '@/lib/logger';
import { getRequestContext } from '@/lib/request-context';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('emits info log as JSON to stdout', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message');

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test message');
    expect(parsed.timestamp).toBeDefined();
  });

  it('emits error log to stderr', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('bad thing', new Error('boom'));

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('bad thing');
    expect(parsed.error.message).toBe('boom');
    expect(parsed.error.stack).toBeDefined();
  });

  it('emits warn log to stderr', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.warn('careful');

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('warn');
  });

  it('includes context from request context when available', () => {
    vi.mocked(getRequestContext).mockReturnValue({
      requestId: 'req-123',
      userId: 'user-456',
      locale: 'he',
    });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('with context');

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.requestId).toBe('req-123');
    expect(parsed.userId).toBe('user-456');
    expect(parsed.locale).toBe('he');
  });

  it('includes additional context from caller', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('with extra', { action: 'login', ip: '1.2.3.4' });

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.action).toBe('login');
    expect(parsed.ip).toBe('1.2.3.4');
  });

  it('handles non-Error objects in error param', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('string error', 'just a string');

    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.error.message).toBe('just a string');
  });
});
