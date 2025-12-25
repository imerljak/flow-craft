/**
 * NetworkView Component
 * Displays HTTP request/response logs with filtering and export capabilities
 */

import React, { useEffect, useState } from 'react';
import { HttpLog, LogActionType, HttpMethod } from '@shared/types';
import { Button } from '@components/Button';
import browser from 'webextension-polyfill';

interface NetworkViewProps {
  className?: string;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<HttpLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<HttpLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUrl, setFilterUrl] = useState('');
  const [filterAction, setFilterAction] = useState<LogActionType | ''>('');
  const [filterMethod, setFilterMethod] = useState<HttpMethod | ''>('');
  const [stats, setStats] = useState<{
    totalLogs: number;
    mockedCount: number;
    blockedCount: number;
    modifiedCount: number;
    originalCount: number;
  } | null>(null);

  useEffect(() => {
    loadLogs();
    loadStats();

    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      loadLogs();
      loadStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadLogs = async (): Promise<void> => {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_LOGS' }) as { success: boolean; logs?: HttpLog[] };
      if (response.success) {
        setLogs(response.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_LOG_STATS' }) as {
        success: boolean;
        stats?: {
          totalLogs: number;
          mockedCount: number;
          blockedCount: number;
          modifiedCount: number;
          originalCount: number;
        };
      };
      if (response.success) {
        setStats(response.stats || null);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleClearLogs = async (): Promise<void> => {
    if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return;
    }

    try {
      await browser.runtime.sendMessage({ type: 'CLEAR_LOGS' });
      setLogs([]);
      setSelectedLog(null);
      await loadStats();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const handleExportJSON = async (): Promise<void> => {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'EXPORT_LOGS',
        filter: getActiveFilter(),
      }) as { success: boolean; data?: string };

      if (response.success && response.data) {
        downloadFile(response.data, 'flowcraft-logs.json', 'application/json');
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const handleExportCSV = async (): Promise<void> => {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'EXPORT_LOGS_CSV',
        filter: getActiveFilter(),
      }) as { success: boolean; data?: string };

      if (response.success && response.data) {
        downloadFile(response.data, 'flowcraft-logs.csv', 'text/csv');
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getActiveFilter = () => {
    const filter: Record<string, unknown> = {};
    if (filterUrl) filter.url = filterUrl;
    if (filterAction) filter.action = filterAction;
    if (filterMethod) filter.method = filterMethod;
    return Object.keys(filter).length > 0 ? filter : undefined;
  };

  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterUrl && !log.url.toLowerCase().includes(filterUrl.toLowerCase())) {
      return false;
    }
    if (filterAction && log.action !== filterAction) {
      return false;
    }
    if (filterMethod && log.method !== filterMethod) {
      return false;
    }
    return true;
  });

  const getActionBadge = (action: LogActionType) => {
    const badges = {
      original: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-300', label: 'Original' },
      mocked: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Mocked' },
      modified: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Modified' },
      blocked: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Blocked' },
      redirected: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Redirected' },
      script_injected: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Script Injected' },
    };

    const badge = badges[action] || badges.original;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-neutral-500';
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-400';
    if (status >= 300 && status < 400) return 'text-blue-600 dark:text-blue-400';
    if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-400';
    if (status >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-neutral-500';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration.toFixed(0)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with Stats */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Network Logs</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'request' : 'requests'}
              {stats && ` (${stats.mockedCount} mocked, ${stats.blockedCount} blocked)`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleExportJSON}>
              Export JSON
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearLogs}>
              Clear Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Filter by URL..."
              value={filterUrl}
              onChange={(e) => setFilterUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as LogActionType | '')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Actions</option>
              <option value="original">Original</option>
              <option value="mocked">Mocked</option>
              <option value="modified">Modified</option>
              <option value="blocked">Blocked</option>
              <option value="redirected">Redirected</option>
              <option value="script_injected">Script Injected</option>
            </select>
          </div>
          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as HttpMethod | '')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Logs List */}
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-neutral-600 dark:text-neutral-400">Loading logs...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-6xl mb-4">🌐</div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                No requests logged yet
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Enable logging in Settings and browse the web to see network requests here
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                Tip: Logging must be enabled in Settings → Logger → Enable Logging
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-20">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-20">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-16">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-28">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-20">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors ${
                        selectedLog?.id === log.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-neutral-900 dark:text-white">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${getStatusColor(log.responseStatus)}`}>
                          {log.responseStatus || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-neutral-900 dark:text-white truncate max-w-md">
                          {log.url}
                        </div>
                        {log.matchedRuleName && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Rule: {log.matchedRuleName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                        {formatDuration(log.duration)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedLog && (
          <div className="w-96 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* General Info */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">General</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 dark:text-neutral-400">URL:</dt>
                    <dd className="text-neutral-900 dark:text-white font-mono text-xs break-all ml-2">
                      {selectedLog.url}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 dark:text-neutral-400">Method:</dt>
                    <dd className="text-neutral-900 dark:text-white font-semibold">{selectedLog.method}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 dark:text-neutral-400">Status:</dt>
                    <dd className={`font-semibold ${getStatusColor(selectedLog.responseStatus)}`}>
                      {selectedLog.responseStatus || 'N/A'} {selectedLog.responseStatusText}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 dark:text-neutral-400">Action:</dt>
                    <dd>{getActionBadge(selectedLog.action)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 dark:text-neutral-400">Duration:</dt>
                    <dd className="text-neutral-900 dark:text-white">{formatDuration(selectedLog.duration)}</dd>
                  </div>
                  {selectedLog.matchedRuleName && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-600 dark:text-neutral-400">Rule:</dt>
                      <dd className="text-neutral-900 dark:text-white">{selectedLog.matchedRuleName}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Request Headers */}
              {selectedLog.requestHeaders && Object.keys(selectedLog.requestHeaders).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Request Headers</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 text-xs font-mono space-y-1">
                    {Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-neutral-600 dark:text-neutral-400 w-32 flex-shrink-0">{key}:</span>
                        <span className="text-neutral-900 dark:text-white break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Headers */}
              {selectedLog.responseHeaders && Object.keys(selectedLog.responseHeaders).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Response Headers</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 text-xs font-mono space-y-1">
                    {Object.entries(selectedLog.responseHeaders).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-neutral-600 dark:text-neutral-400 w-32 flex-shrink-0">{key}:</span>
                        <span className="text-neutral-900 dark:text-white break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.requestBody && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Request Body</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 text-xs font-mono text-neutral-900 dark:text-white whitespace-pre-wrap break-all max-h-48 overflow-auto">
                    {selectedLog.requestBody}
                  </div>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.responseBody && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Response Body</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 text-xs font-mono text-neutral-900 dark:text-white whitespace-pre-wrap break-all max-h-48 overflow-auto">
                    {selectedLog.responseBody}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
