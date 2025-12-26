/**
 * SettingsView Component
 * Manages extension settings including logger configuration
 */

import React, { useEffect, useState, useRef } from 'react';
import { Settings, DEFAULT_SETTINGS, ImportOptions, ImportResult } from '@shared/types';
import { Storage } from '@storage/index';
import { Button } from '@components/Button';
import Browser from 'webextension-polyfill';

interface SettingsViewProps {
  className?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (): Promise<void> => {
    try {
      const loadedSettings = await Storage.getSettings();
      // Merge with defaults to ensure logger settings exist
      setSettings({
        ...DEFAULT_SETTINGS,
        ...loadedSettings,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          ...(loadedSettings.logger || {}),
        },
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setSaveStatus('saving');
    try {
      await Storage.saveSettings(settings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleLoggerToggle = (enabled: boolean): void => {
    setSettings({
      ...settings,
      logger: {
        ...settings.logger,
        enabled,
      },
    });
  };

  const handleLoggerSettingChange = (key: keyof typeof settings.logger, value: unknown): void => {
    setSettings({
      ...settings,
      logger: {
        ...settings.logger,
        [key]: value,
      },
    });
  };

  const handleUrlFilterChange = (filters: string[]): void => {
    setSettings({
      ...settings,
      logger: {
        ...settings.logger,
        urlFilters: filters,
      },
    });
  };

  const addUrlFilter = (): void => {
    const filter = prompt('Enter URL pattern to exclude (e.g., *://*.google-analytics.com/*)');
    if (filter && filter.trim()) {
      handleUrlFilterChange([...settings.logger.urlFilters, filter.trim()]);
    }
  };

  const removeUrlFilter = (index: number): void => {
    const newFilters = [...settings.logger.urlFilters];
    newFilters.splice(index, 1);
    handleUrlFilterChange(newFilters);
  };

  const handleExportRules = async (includeSettings: boolean, includeGroups: boolean): Promise<void> => {
    setExportStatus('exporting');
    try {
      const response = await Browser.runtime.sendMessage({
        type: 'EXPORT_RULES',
        includeSettings,
        includeGroups,
      }) as { success: boolean; data?: string; error?: string };

      if (response.success && response.data) {
        // Create download
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowcraft-rules-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportStatus('success');
        setTimeout(() => setExportStatus('idle'), 2000);
      } else {
        console.error('Export failed:', response.error);
        setExportStatus('error');
        setTimeout(() => setExportStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const options: ImportOptions = {
        overwriteExisting: false, // Default: merge with existing
        importSettings: false, // Don't import settings by default
        importGroups: true,
        preserveIds: false, // Generate new IDs by default
      };

      const response = await Browser.runtime.sendMessage({
        type: 'IMPORT_RULES',
        data,
        options,
      }) as { success: boolean; result?: ImportResult; error?: string };

      if (response.success && response.result) {
        setImportResult(response.result);
        setImportStatus('success');
        // Reload settings in case they were imported
        await loadSettings();
      } else {
        console.error('Import failed:', response.error);
        setImportStatus('error');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setImportResult({
        success: false,
        rulesImported: 0,
        groupsImported: 0,
        settingsImported: false,
        errors: [error instanceof Error ? error.message : 'Failed to parse file'],
        warnings: [],
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-600 dark:text-neutral-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-auto p-8 ${className}`}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h2>
          <Button data-testid="save-settings-btn" variant="primary" onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'error' && '✗ Error'}
            {saveStatus === 'idle' && 'Save Settings'}
          </Button>
        </div>

        {/* General Settings */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  Enable Extension
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Master toggle for all FlowCraft functionality
                </p>
              </div>
              <button
                data-testid="enable-extension-toggle"
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.enabled
                    ? 'bg-primary-500'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  Enable Notifications
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Show notifications when rules are applied
                </p>
              </div>
              <button
                data-testid="enable-notifications-toggle"
                onClick={() =>
                  setSettings({ ...settings, enableNotifications: !settings.enableNotifications })
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.enableNotifications
                    ? 'bg-primary-500'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                    settings.enableNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  Auto-enable New Rules
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Automatically enable newly created rules
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({ ...settings, autoEnableNewRules: !settings.autoEnableNewRules })
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoEnableNewRules
                    ? 'bg-primary-500'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                    settings.autoEnableNewRules ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Logger Settings */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Request/Response Logger
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                  Enable Logging
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Capture HTTP requests and responses for debugging
                </p>
              </div>
              <button
                data-testid="logger-enabled-toggle"
                onClick={() => handleLoggerToggle(!settings.logger.enabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.logger.enabled
                    ? 'bg-primary-500'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                    settings.logger.enabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.logger.enabled && (
              <>
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white block mb-2">
                    Maximum Log Size
                  </label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                    Maximum number of requests to keep (older requests are automatically removed)
                  </p>
                  <input
                    data-testid="max-log-size-input"
                    type="number"
                    min="50"
                    max="2000"
                    step="50"
                    value={settings.logger.maxLogSize}
                    onChange={(e) =>
                      handleLoggerSettingChange('maxLogSize', parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Current: {settings.logger.maxLogSize} requests
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white block mb-2">
                    Maximum Body Size
                  </label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                    Maximum body size to capture in bytes (0 = unlimited)
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="1048576"
                    step="1024"
                    value={settings.logger.maxBodySize}
                    onChange={(e) =>
                      handleLoggerSettingChange('maxBodySize', parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Current: {settings.logger.maxBodySize === 0 ? 'Unlimited' : `${(settings.logger.maxBodySize / 1024).toFixed(0)} KB`}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white">
                      Capture Headers
                    </label>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Include request/response headers in logs
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleLoggerSettingChange('captureHeaders', !settings.logger.captureHeaders)
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.logger.captureHeaders
                        ? 'bg-primary-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                        settings.logger.captureHeaders ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white">
                      Capture Request Bodies
                    </label>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Include request payloads (may contain sensitive data)
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleLoggerSettingChange(
                        'captureRequestBody',
                        !settings.logger.captureRequestBody
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.logger.captureRequestBody
                        ? 'bg-primary-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                        settings.logger.captureRequestBody ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white">
                      Capture Response Bodies
                    </label>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Include response payloads (increases storage usage)
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleLoggerSettingChange(
                        'captureResponseBody',
                        !settings.logger.captureResponseBody
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.logger.captureResponseBody
                        ? 'bg-primary-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                        settings.logger.captureResponseBody ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white">
                      Preserve Logs on Disable
                    </label>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      Keep logs when logging is disabled
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleLoggerSettingChange(
                        'preserveOnDisable',
                        !settings.logger.preserveOnDisable
                      )
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.logger.preserveOnDisable
                        ? 'bg-primary-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                        settings.logger.preserveOnDisable ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white block mb-2">
                    URL Exclusion Filters
                  </label>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                    URLs matching these patterns won&apos;t be logged (supports wildcards)
                  </p>
                  <div className="space-y-2">
                    {settings.logger.urlFilters.map((filter, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 p-2 rounded"
                      >
                        <code className="flex-1 text-xs text-neutral-900 dark:text-white">
                          {filter}
                        </code>
                        <button
                          onClick={() => removeUrlFilter(index)}
                          className="text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addUrlFilter}>
                      + Add Filter
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Import/Export Settings */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Import/Export Rules
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white block mb-2">
                Export Rules
              </label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                Download your rules, groups, and optionally settings as a JSON file
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleExportRules(false, true)}
                  disabled={exportStatus === 'exporting'}
                  data-testid="export-rules-btn"
                >
                  {exportStatus === 'exporting' && 'Exporting...'}
                  {exportStatus === 'success' && '✓ Exported'}
                  {exportStatus === 'error' && '✗ Error'}
                  {exportStatus === 'idle' && 'Export Rules'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportRules(true, true)}
                  disabled={exportStatus === 'exporting'}
                  data-testid="export-all-btn"
                >
                  Export with Settings
                </Button>
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <label className="text-sm font-medium text-neutral-900 dark:text-white block mb-2">
                Import Rules
              </label>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                Load rules from a previously exported JSON file. Imported rules will be merged with your existing rules.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleImportClick}
                disabled={importStatus === 'importing'}
                data-testid="import-rules-btn"
              >
                {importStatus === 'importing' && 'Importing...'}
                {importStatus === 'success' && '✓ Imported'}
                {importStatus === 'error' && '✗ Error'}
                {importStatus === 'idle' && 'Choose File'}
              </Button>

              {/* Import Result */}
              {importResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  importResult.success
                    ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                    : 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {importResult.success ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold ${
                        importResult.success
                          ? 'text-success-900 dark:text-success-200'
                          : 'text-error-900 dark:text-error-200'
                      }`}>
                        {importResult.success ? 'Import Successful' : 'Import Failed'}
                      </h4>
                      {importResult.success && (
                        <div className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 space-y-1">
                          <p>Rules imported: {importResult.rulesImported}</p>
                          {importResult.groupsImported > 0 && (
                            <p>Groups imported: {importResult.groupsImported}</p>
                          )}
                          {importResult.settingsImported && (
                            <p>Settings imported</p>
                          )}
                        </div>
                      )}
                      {importResult.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-warning-700 dark:text-warning-300">Warnings:</p>
                          <ul className="text-xs text-warning-600 dark:text-warning-400 mt-1 list-disc list-inside">
                            {importResult.warnings.map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-error-700 dark:text-error-300">Errors:</p>
                          <ul className="text-xs text-error-600 dark:text-error-400 mt-1 list-disc list-inside">
                            {importResult.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setImportResult(null)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  <strong>Note:</strong> Imported rules will be assigned new IDs to avoid conflicts. Settings are not imported by default to preserve your configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
