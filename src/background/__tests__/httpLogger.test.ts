/**
 * Unit tests for HttpLogger service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpLogger } from '../httpLogger';
import { HttpMethod, LogActionType, DEFAULT_SETTINGS } from '@shared/types';
import Browser from 'webextension-polyfill';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
  },
}));

// Mock Storage
vi.mock('@storage/index', () => ({
  Storage: {
    getSettings: vi.fn().mockResolvedValue({
      enabled: true,
      theme: 'system',
      enableRequestHistory: false,
      maxHistorySize: 100,
      enableNotifications: true,
      autoEnableNewRules: true,
      logger: {
        enabled: false,
        maxLogSize: 500,
        captureHeaders: true,
        captureRequestBody: false,
        captureResponseBody: true,
        maxBodySize: 102400,
        preserveOnDisable: false,
        urlFilters: [],
      },
    }),
  },
}));

describe('HttpLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset HttpLogger state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpLogger as any).logs = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpLogger as any).settings = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HttpLogger as any).initialized = false;
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });

      await HttpLogger.initialize();

      expect(Browser.storage.local.get).toHaveBeenCalledWith(['httpLogs']);
    });

    it('should load existing logs from storage', async () => {
      const existingLogs = [
        {
          id: '1',
          url: 'https://api.example.com/test',
          method: HttpMethod.GET,
          action: LogActionType.ORIGINAL,
          timestamp: Date.now(),
          startTime: 100,
          isMocked: false,
          isBlocked: false,
        },
      ];

      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: existingLogs });

      await HttpLogger.initialize();

      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.url).toBe('https://api.example.com/test');
    });

    it('should not initialize twice', async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });

      await HttpLogger.initialize();
      await HttpLogger.initialize();

      expect(Browser.storage.local.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL filtering', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      await HttpLogger.initialize();
    });

    it('should not log when logger is disabled', async () => {
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: false } };
      await HttpLogger.updateSettings(settings);

      const logId = await HttpLogger.logRequest(
        { url: 'https://api.example.com/test', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );

      expect(logId).toBe('');
      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should filter URLs matching exclusion patterns', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
          urlFilters: ['*://*/favicon.ico', '*://*.google-analytics.com/*'],
        },
      };
      await HttpLogger.updateSettings(settings);

      const logId1 = await HttpLogger.logRequest(
        { url: 'https://example.com/favicon.ico', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );

      const logId2 = await HttpLogger.logRequest(
        { url: 'https://www.google-analytics.com/collect', method: HttpMethod.POST },
        { action: LogActionType.ORIGINAL }
      );

      expect(logId1).toBe('');
      expect(logId2).toBe('');
      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should log URLs that do not match exclusion patterns', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
          urlFilters: ['*://*/favicon.ico'],
        },
      };
      await HttpLogger.updateSettings(settings);

      const logId = await HttpLogger.logRequest(
        { url: 'https://api.example.com/data', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );

      expect(logId).not.toBe('');
      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(1);
    });
  });

  describe('logging requests', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: true } };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);
    });

    it('should log a request and return a log ID', async () => {
      const logId = await HttpLogger.logRequest(
        {
          url: 'https://api.example.com/users',
          method: HttpMethod.POST,
          headers: { 'Content-Type': 'application/json' },
          body: '{"name": "Test"}',
        },
        {
          action: LogActionType.ORIGINAL,
        }
      );

      expect(logId).toBeTruthy();
      expect(logId).toMatch(/^[a-f0-9-]{36}$/); // UUID format

      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.id).toBe(logId);
      expect(logs[0]?.url).toBe('https://api.example.com/users');
      expect(logs[0]?.method).toBe(HttpMethod.POST);
      expect(logs[0]?.action).toBe(LogActionType.ORIGINAL);
    });

    it('should truncate request body if it exceeds maxBodySize', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
          captureRequestBody: true,
          maxBodySize: 10,
        },
      };
      await HttpLogger.updateSettings(settings);

      const longBody = 'a'.repeat(100);
      await HttpLogger.logRequest(
        {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          body: longBody,
        },
        { action: LogActionType.ORIGINAL }
      );

      const logs = await HttpLogger.getLogs();
      expect(logs[0]?.requestBody).toBe('aaaaaaaaaa... [truncated]');
    });

    it('should not capture headers if captureHeaders is false', async () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
          captureHeaders: false,
        },
      };
      await HttpLogger.updateSettings(settings);

      await HttpLogger.logRequest(
        {
          url: 'https://api.example.com/test',
          method: HttpMethod.GET,
          headers: { Authorization: 'Bearer secret' },
        },
        { action: LogActionType.ORIGINAL }
      );

      const logs = await HttpLogger.getLogs();
      expect(logs[0]?.requestHeaders).toBeUndefined();
    });

    it('should log mocked requests with rule information', async () => {
      await HttpLogger.logRequest(
        {
          url: 'https://api.example.com/mock',
          method: HttpMethod.GET,
        },
        {
          action: LogActionType.MOCKED,
          matchedRuleId: 'rule-123',
          matchedRuleName: 'Mock API Response',
          mockDelay: 1000,
        }
      );

      const logs = await HttpLogger.getLogs();
      expect(logs[0]?.isMocked).toBe(true);
      expect(logs[0]?.matchedRuleId).toBe('rule-123');
      expect(logs[0]?.matchedRuleName).toBe('Mock API Response');
      expect(logs[0]?.mockDelay).toBe(1000);
    });
  });

  describe('logging responses', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: true } };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);
    });

    it('should update a log entry with response data', async () => {
      const logId = await HttpLogger.logRequest(
        { url: 'https://api.example.com/test', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );

      await HttpLogger.logResponse(logId, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        body: '{"success": true}',
      });

      const logs = await HttpLogger.getLogs();
      expect(logs[0]?.responseStatus).toBe(200);
      expect(logs[0]?.responseStatusText).toBe('OK');
      expect(logs[0]?.responseBody).toBe('{"success": true}');
      expect(logs[0]?.duration).toBeDefined();
      expect(logs[0]?.endTime).toBeDefined();
    });

    it('should handle invalid log IDs gracefully', async () => {
      await HttpLogger.logResponse('invalid-id', {
        status: 200,
        statusText: 'OK',
      });

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('circular buffer', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = {
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
          maxLogSize: 5,
        },
      };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);
    });

    it('should trim old logs when max size is exceeded', async () => {
      // Add 10 logs
      for (let i = 0; i < 10; i++) {
        await HttpLogger.logRequest(
          { url: `https://api.example.com/test${i}`, method: HttpMethod.GET },
          { action: LogActionType.ORIGINAL }
        );
      }

      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(5);
      // Should keep the 5 most recent logs
      expect(logs[0]?.url).toBe('https://api.example.com/test5');
      expect(logs[4]?.url).toBe('https://api.example.com/test9');
    });
  });

  describe('filtering logs', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: true } };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);

      // Add test logs
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/users', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/posts', method: HttpMethod.POST },
        { action: LogActionType.MOCKED, matchedRuleId: 'rule-1' }
      );
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/comments', method: HttpMethod.GET },
        { action: LogActionType.BLOCKED }
      );
    });

    it('should filter by URL', async () => {
      const filtered = await HttpLogger.getFilteredLogs({ url: 'posts' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.url).toContain('posts');
    });

    it('should filter by method', async () => {
      const filtered = await HttpLogger.getFilteredLogs({ method: HttpMethod.GET });
      expect(filtered).toHaveLength(2);
    });

    it('should filter by action', async () => {
      const filtered = await HttpLogger.getFilteredLogs({ action: LogActionType.MOCKED });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.action).toBe(LogActionType.MOCKED);
    });

    it('should filter by rule ID', async () => {
      const filtered = await HttpLogger.getFilteredLogs({ ruleId: 'rule-1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.matchedRuleId).toBe('rule-1');
    });

    it('should apply multiple filters', async () => {
      const filtered = await HttpLogger.getFilteredLogs({
        method: HttpMethod.GET,
        action: LogActionType.BLOCKED,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.url).toContain('comments');
    });
  });

  describe('clearing logs', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: true } };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);

      // Add test logs
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/test1', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/test2', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );
    });

    it('should clear all logs', async () => {
      await HttpLogger.clearLogs();

      const logs = await HttpLogger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should clear logs older than timestamp', async () => {
      // Get current timestamp after the 2 logs were added in beforeEach
      const now = Date.now() + 1; // +1 to ensure it's after the logs

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await HttpLogger.logRequest(
        { url: 'https://api.example.com/test3', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );

      // Clear logs older than 'now' (should clear the 2 from beforeEach)
      await HttpLogger.clearOldLogs(now);

      const logs = await HttpLogger.getLogs();
      // Should only have the newest log (test3)
      expect(logs).toHaveLength(1);
      expect(logs[0]?.url).toBe('https://api.example.com/test3');
    });
  });

  describe('exporting logs', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: true } };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);

      await HttpLogger.logRequest(
        { url: 'https://api.example.com/test', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );
    });

    it('should export logs as JSON', async () => {
      const json = await HttpLogger.exportLogs();
      const data = JSON.parse(json);

      expect(data.version).toBe('1.0');
      expect(data.count).toBe(1);
      expect(data.logs).toHaveLength(1);
      expect(data.logs[0].url).toBe('https://api.example.com/test');
    });

    it('should export logs as CSV', async () => {
      const csv = await HttpLogger.exportLogsCSV();

      expect(csv).toContain('Timestamp,URL,Method,Action,Status,Duration');
      expect(csv).toContain('https://api.example.com/test');
      expect(csv).toContain('GET');
      expect(csv).toContain('original');
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      vi.mocked(Browser.storage.local.get).mockResolvedValue({ httpLogs: [] });
      const settings = { ...DEFAULT_SETTINGS, logger: { ...DEFAULT_SETTINGS.logger, enabled: true } };
      await HttpLogger.initialize();
      await HttpLogger.updateSettings(settings);
    });

    it('should return correct statistics', async () => {
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/1', method: HttpMethod.GET },
        { action: LogActionType.ORIGINAL }
      );
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/2', method: HttpMethod.POST },
        { action: LogActionType.MOCKED }
      );
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/3', method: HttpMethod.DELETE },
        { action: LogActionType.BLOCKED }
      );
      await HttpLogger.logRequest(
        { url: 'https://api.example.com/4', method: HttpMethod.PUT },
        { action: LogActionType.MODIFIED }
      );

      const stats = await HttpLogger.getStats();

      expect(stats.totalLogs).toBe(4);
      expect(stats.mockedCount).toBe(1);
      expect(stats.blockedCount).toBe(1);
      expect(stats.modifiedCount).toBe(1);
      expect(stats.originalCount).toBe(1);
    });

    it('should return empty stats when no logs exist', async () => {
      const stats = await HttpLogger.getStats();

      expect(stats.totalLogs).toBe(0);
      expect(stats.mockedCount).toBe(0);
      expect(stats.blockedCount).toBe(0);
    });
  });
});
