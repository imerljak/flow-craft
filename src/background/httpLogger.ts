/**
 * HTTP Logger Service
 * Captures and manages HTTP request/response logs for debugging and analysis
 *
 * Features:
 * - Circular buffer with configurable max size
 * - Privacy-conscious settings (opt-in body capture, URL filtering)
 * - Efficient storage management
 * - Pattern-based URL filtering
 * - Export functionality
 */

import type {
  HttpLog,
  HttpMethod,
  ResourceType,
  LogActionType,
  Settings,
} from '../shared/types';
import { Storage } from '../storage';
import Browser from 'webextension-polyfill';

export interface LogRequest {
  url: string;
  method: HttpMethod;
  resourceType?: ResourceType;
  headers?: Record<string, string>;
  body?: string;
  tabId?: number;
  frameId?: number;
}

export interface LogResponse {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface LogInterception {
  action: LogActionType;
  matchedRuleId?: string;
  matchedRuleName?: string;
  actionDetails?: {
    modifiedHeaders?: string[];
    modifiedParams?: string[];
    redirectUrl?: string;
    injectedScriptSize?: number;
  };
  mockDelay?: number;
}

/**
 * HTTP Logger - manages request/response logging with privacy and performance in mind
 */
export class HttpLogger {
  private static logs: HttpLog[] = [];
  private static settings: Settings | null = null;
  private static initialized = false;

  /**
   * Initialize the logger by loading existing logs and settings
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load settings
      this.settings = await Storage.getSettings();

      // Load existing logs
      const storage = await Browser.storage.local.get(['httpLogs']);
      this.logs = (storage.httpLogs as HttpLog[]) || [];

      // Trim logs if they exceed max size (in case settings were changed)
      await this.trimLogs();

      this.initialized = true;
      console.log('[FlowCraft Logger] Initialized with', this.logs.length, 'logs');
    } catch (error) {
      console.error('[FlowCraft Logger] Failed to initialize:', error);
      this.initialized = false;
    }
  }

  /**
   * Check if logging is enabled and should capture this URL
   */
  private static shouldLog(url: string): boolean {
    if (!this.settings?.logger.enabled) return false;

    // Check URL filters
    for (const filter of this.settings.logger.urlFilters) {
      if (this.matchesPattern(url, filter)) {
        return false; // URL matches exclusion filter
      }
    }

    return true;
  }

  /**
   * Simple pattern matching for URL filters
   * Supports wildcards (*) for basic filtering
   */
  private static matchesPattern(url: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  }

  /**
   * Truncate body if it exceeds max size
   */
  private static truncateBody(body: string | undefined, maxSize: number): string | undefined {
    if (!body || maxSize === 0) return body;

    if (body.length > maxSize) {
      return body.substring(0, maxSize) + '... [truncated]';
    }

    return body;
  }

  /**
   * Create a new log entry (request started)
   * Returns a log ID that can be used to update the entry later
   */
  static async logRequest(request: LogRequest, interception: LogInterception): Promise<string> {
    if (!this.shouldLog(request.url)) {
      return ''; // Empty ID means not logged
    }

    const loggerSettings = this.settings?.logger;
    if (!loggerSettings) return '';

    const logId = crypto.randomUUID();
    const now = Date.now();
    const startTime = performance.now();

    const log: HttpLog = {
      id: logId,
      url: request.url,
      method: request.method,
      resourceType: request.resourceType,
      requestHeaders: loggerSettings.captureHeaders ? request.headers : undefined,
      requestBody: loggerSettings.captureRequestBody
        ? this.truncateBody(request.body, loggerSettings.maxBodySize)
        : undefined,
      action: interception.action,
      matchedRuleId: interception.matchedRuleId,
      matchedRuleName: interception.matchedRuleName,
      actionDetails: interception.actionDetails,
      timestamp: now,
      startTime,
      tabId: request.tabId,
      frameId: request.frameId,
      isMocked: interception.action === 'mocked',
      isBlocked: interception.action === 'blocked',
      mockDelay: interception.mockDelay,
    };

    this.logs.push(log);
    await this.trimLogs();
    await this.persist();

    console.log('[FlowCraft Logger] Logged request:', request.url, log.action);

    return logId;
  }

  /**
   * Update an existing log entry with response data
   */
  static async logResponse(logId: string, response: LogResponse): Promise<void> {
    if (!logId) return; // Not logged

    const log = this.logs.find((l) => l.id === logId);
    if (!log) return;

    const endTime = performance.now();
    const loggerSettings = this.settings?.logger;

    log.responseStatus = response.status;
    log.responseStatusText = response.statusText;
    log.responseHeaders = loggerSettings?.captureHeaders ? response.headers : undefined;
    log.responseBody = loggerSettings?.captureResponseBody
      ? this.truncateBody(response.body, loggerSettings.maxBodySize)
      : undefined;
    log.endTime = endTime;
    log.duration = endTime - log.startTime;

    await this.persist();

    console.log('[FlowCraft Logger] Updated log with response:', log.url, response.status);
  }

  /**
   * Get all logs (for UI display)
   */
  static async getLogs(): Promise<HttpLog[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.logs]; // Return copy to prevent external modification
  }

  /**
   * Get logs filtered by criteria
   */
  static async getFilteredLogs(filter: {
    url?: string;
    method?: HttpMethod;
    action?: LogActionType;
    ruleId?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<HttpLog[]> {
    let filtered = await this.getLogs();

    if (filter.url) {
      const urlLower = filter.url.toLowerCase();
      filtered = filtered.filter((log) => log.url.toLowerCase().includes(urlLower));
    }

    if (filter.method) {
      filtered = filtered.filter((log) => log.method === filter.method);
    }

    if (filter.action) {
      filtered = filtered.filter((log) => log.action === filter.action);
    }

    if (filter.ruleId) {
      filtered = filtered.filter((log) => log.matchedRuleId === filter.ruleId);
    }

    if (filter.startTime !== undefined) {
      filtered = filtered.filter((log) => log.timestamp >= filter.startTime!);
    }

    if (filter.endTime !== undefined) {
      filtered = filtered.filter((log) => log.timestamp <= filter.endTime!);
    }

    return filtered;
  }

  /**
   * Clear all logs
   */
  static async clearLogs(): Promise<void> {
    this.logs = [];
    await this.persist();
    console.log('[FlowCraft Logger] Cleared all logs');
  }

  /**
   * Clear logs older than a certain timestamp
   */
  static async clearOldLogs(beforeTimestamp: number): Promise<void> {
    const originalCount = this.logs.length;
    this.logs = this.logs.filter((log) => log.timestamp >= beforeTimestamp);
    const clearedCount = originalCount - this.logs.length;

    if (clearedCount > 0) {
      await this.persist();
      console.log('[FlowCraft Logger] Cleared', clearedCount, 'old logs');
    }
  }

  /**
   * Trim logs to respect max size (circular buffer)
   */
  private static async trimLogs(): Promise<void> {
    const maxSize = this.settings?.logger.maxLogSize || 500;

    if (this.logs.length > maxSize) {
      const excess = this.logs.length - maxSize;
      this.logs.splice(0, excess); // Remove oldest logs
      console.log('[FlowCraft Logger] Trimmed', excess, 'old logs');
    }
  }

  /**
   * Persist logs to storage
   */
  private static async persist(): Promise<void> {
    try {
      await Browser.storage.local.set({ httpLogs: this.logs });
    } catch (error) {
      console.error('[FlowCraft Logger] Failed to persist logs:', error);
    }
  }

  /**
   * Export logs as JSON
   */
  static async exportLogs(filter?: {
    url?: string;
    action?: LogActionType;
    startTime?: number;
    endTime?: number;
  }): Promise<string> {
    const logs = filter ? await this.getFilteredLogs(filter) : await this.getLogs();

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        count: logs.length,
        logs,
      },
      null,
      2
    );
  }

  /**
   * Export logs as CSV
   */
  static async exportLogsCSV(filter?: {
    url?: string;
    action?: LogActionType;
    startTime?: number;
    endTime?: number;
  }): Promise<string> {
    const logs = filter ? await this.getFilteredLogs(filter) : await this.getLogs();

    const headers = [
      'Timestamp',
      'URL',
      'Method',
      'Action',
      'Status',
      'Duration (ms)',
      'Rule',
      'Mocked',
      'Blocked',
    ];

    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.url,
      log.method,
      log.action,
      log.responseStatus || '',
      log.duration?.toFixed(2) || '',
      log.matchedRuleName || '',
      log.isMocked ? 'Yes' : 'No',
      log.isBlocked ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Update settings (called when settings change)
   */
  static async updateSettings(settings: Settings): Promise<void> {
    const wasEnabled = this.settings?.logger.enabled;
    this.settings = settings;

    // If logger was disabled and preserveOnDisable is false, clear logs
    if (wasEnabled && !settings.logger.enabled && !settings.logger.preserveOnDisable) {
      await this.clearLogs();
    }

    // Trim logs if max size was reduced
    await this.trimLogs();
  }

  /**
   * Get logging statistics
   */
  static async getStats(): Promise<{
    totalLogs: number;
    mockedCount: number;
    blockedCount: number;
    modifiedCount: number;
    originalCount: number;
    oldestTimestamp?: number;
    newestTimestamp?: number;
    averageDuration?: number;
  }> {
    const logs = await this.getLogs();

    if (logs.length === 0) {
      return {
        totalLogs: 0,
        mockedCount: 0,
        blockedCount: 0,
        modifiedCount: 0,
        originalCount: 0,
      };
    }

    const mockedCount = logs.filter((l) => l.isMocked).length;
    const blockedCount = logs.filter((l) => l.isBlocked).length;
    const modifiedCount = logs.filter((l) => l.action === 'modified').length;
    const originalCount = logs.filter((l) => l.action === 'original').length;

    const timestamps = logs.map((l) => l.timestamp);
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);

    const durations = logs.filter((l) => l.duration !== undefined).map((l) => l.duration!);
    const averageDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : undefined;

    return {
      totalLogs: logs.length,
      mockedCount,
      blockedCount,
      modifiedCount,
      originalCount,
      oldestTimestamp,
      newestTimestamp,
      averageDuration,
    };
  }
}
