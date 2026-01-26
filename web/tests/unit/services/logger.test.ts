/**
 * Logger Service Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock import.meta.env before importing logger
vi.mock('import.meta.env', () => ({
  DEV: true,
}));

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should call console.debug for debug level', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should call console.info for info level', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should call console.warn for warn level', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.warn('Test warn message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should call console.error for error level', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Context Support', () => {
    it('should include context in log output', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.info('Test message', { key: 'value' });
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact apiKey values', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.info('Test', { apiKey: 'secret-key' });

      const loggedArg = consoleSpy.info.mock.calls[0][0];
      expect(loggedArg).not.toContain('secret-key');
      expect(loggedArg).toContain('[REDACTED]');
    });

    it('should redact password values', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.info('Test', { password: 'my-password' });

      const loggedArg = consoleSpy.info.mock.calls[0][0];
      expect(loggedArg).not.toContain('my-password');
      expect(loggedArg).toContain('[REDACTED]');
    });

    it('should redact apiSecret values', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.info('Test', { apiSecret: 'super-secret' });

      const loggedArg = consoleSpy.info.mock.calls[0][0];
      expect(loggedArg).not.toContain('super-secret');
      expect(loggedArg).toContain('[REDACTED]');
    });

    it('should redact nested sensitive values', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      logger.info('Test', {
        user: {
          name: 'John',
          credentials: {
            apiKey: 'nested-key',
          },
        },
      });

      const loggedArg = consoleSpy.info.mock.calls[0][0];
      expect(loggedArg).not.toContain('nested-key');
      expect(loggedArg).toContain('[REDACTED]');
    });
  });

  describe('Child Logger', () => {
    it('should include default context in child logger', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      const childLogger = logger.child({ service: 'test-service' });

      childLogger.info('Test message');

      const loggedArg = consoleSpy.info.mock.calls[0][0];
      expect(loggedArg).toContain('test-service');
    });

    it('should merge context in child logger calls', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      const childLogger = logger.child({ service: 'test-service' });

      childLogger.info('Test message', { action: 'test-action' });

      const loggedArg = consoleSpy.info.mock.calls[0][0];
      expect(loggedArg).toContain('test-service');
      expect(loggedArg).toContain('test-action');
    });
  });

  describe('Exception Logging', () => {
    it('should log error with stack trace', async () => {
      const { logger } = await import('../../../src/lib/services/logger');
      const error = new Error('Test error');

      logger.exception('An error occurred', error);

      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedArg = consoleSpy.error.mock.calls[0][0];
      expect(loggedArg).toContain('Test error');
    });
  });
});
