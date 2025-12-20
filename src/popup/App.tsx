import React, { useEffect, useState } from 'react';
import { Rule } from '@shared/types';
import { Storage } from '@storage/index';

/**
 * Main popup application component
 */
const App: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
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

  const toggleRule = async (ruleId: string): Promise<void> => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updatedRule = { ...rule, enabled: !rule.enabled, updatedAt: Date.now() };
      await Storage.saveRule(updatedRule);
      await loadRules();
    }
  };

  if (loading) {
    return (
      <div className="w-[600px] h-[400px] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[600px] h-[400px] bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">FlowCraft</h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Privacy-first HTTP manipulation toolkit
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-neutral-400 dark:text-neutral-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
              No rules yet
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
              Create your first rule to start manipulating HTTP requests
            </p>
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors">
              Create Rule
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        rule.enabled ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          rule.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
                        {rule.name}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {rule.matcher.pattern}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded">
                      {rule.action.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 px-4 py-2 flex justify-between items-center">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
        </div>
        <button className="text-xs text-primary-500 hover:text-primary-600 font-medium">
          Open Settings
        </button>
      </footer>
    </div>
  );
};

export default App;
