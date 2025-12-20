import React, { useEffect, useState } from 'react';
import { Rule } from '@shared/types';
import { Storage } from '@storage/index';
import Browser from 'webextension-polyfill';

/**
 * Simplified popup - informative only, following Requestly pattern
 */
const App: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExtensionEnabled, setIsExtensionEnabled] = useState(true);

  useEffect(() => {
    loadRules();
    loadExtensionState();
  }, []);

  const loadRules = async (): Promise<void> => {
    try {
      const loadedRules = await Storage.getRules();
      setRules(loadedRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExtensionState = async (): Promise<void> => {
    const settings = await Storage.getSettings();
    setIsExtensionEnabled(settings.enabled ?? true);
  };

  const toggleExtension = async (): Promise<void> => {
    const newState = !isExtensionEnabled;
    setIsExtensionEnabled(newState);

    // Load current settings and update only the enabled field
    const currentSettings = await Storage.getSettings();
    await Storage.saveSettings({ ...currentSettings, enabled: newState });
  };

  const toggleRule = async (ruleId: string): Promise<void> => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updatedRule = { ...rule, enabled: !rule.enabled, updatedAt: Date.now() };
      await Storage.saveRule(updatedRule);
      await loadRules();
    }
  };

  const openOptionsPage = (): void => {
    Browser.runtime.openOptionsPage();
  };

  const activeRulesCount = rules.filter((r) => r.enabled).length;
  const totalRulesCount = rules.length;

  if (loading) {
    return (
      <div className="w-[400px] h-[500px] bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[400px] min-h-[500px] max-h-[600px] bg-white dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <img src="/icons/icon48.png" alt="FlowCraft" className="w-8 h-8" />

          {/* Status Toggle */}
          <button
            onClick={toggleExtension}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            aria-label={isExtensionEnabled ? 'Disable FlowCraft' : 'Enable FlowCraft'}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isExtensionEnabled ? 'bg-green-500' : 'bg-neutral-400'
              }`}
            />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {isExtensionEnabled ? 'Running' : 'Paused'}
            </span>
          </button>
        </div>

        {/* Open App Button */}
        <button
          onClick={openOptionsPage}
          className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          Open App
        </button>
      </div>

      {/* Rules Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Section Header */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              HTTP Rules
            </h2>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {activeRulesCount} of {totalRulesCount} active
            </span>
          </div>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                No rules yet
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                Create your first rule to start manipulating HTTP requests
              </p>
              <button
                onClick={openOptionsPage}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors"
              >
                Create Your First Rule
              </button>
            </div>
          ) : (
            <div className="p-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {/* Rule Icon */}
                  <div className="text-base flex-shrink-0">
                    {rule.action.type === 'header_modification' && '⚡'}
                    {rule.action.type === 'url_redirect' && '🔄'}
                    {rule.action.type === 'request_block' && '🚫'}
                    {rule.action.type === 'script_injection' && '💉'}
                    {rule.action.type === 'query_param' && '🔧'}
                    {rule.action.type === 'mock_response' && '🎭'}
                  </div>

                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {rule.name}
                    </div>
                    {rule.description && (
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                        {rule.description}
                      </div>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                      rule.enabled
                        ? 'bg-primary-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                    aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-1 ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {rules.length > 0 && (
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={openOptionsPage}
              className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-sm font-medium rounded-md transition-colors"
            >
              + New Rule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
