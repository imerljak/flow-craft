import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Rule, RuleTemplate, RuleConflict } from '@shared/types';
import { Storage } from '@storage/index';
import { Modal } from '@components/Modal';
import { Drawer } from '@components/Drawer/Drawer';
import { RuleEditor } from '@components/RuleEditor';
import { Button } from '@components/Button';
import { NetworkView } from '@components/NetworkView';
import { SettingsView } from '@components/SettingsView';
import { TemplateBrowser } from '@components/TemplateBrowser';
import { ConflictPanel } from '@components/ConflictPanel';
import { generateId } from '@shared/utils';
import { DEFAULT_RULE_PRIORITY } from '@shared/constants';
import browser from 'webextension-polyfill';

type View = 'rules' | 'network' | 'settings' | 'templates';

/**
 * Options page - Full application with CRUD functionality
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('rules');
  const [rules, setRules] = useState<Rule[]>([]);
  const [conflicts, setConflicts] = useState<RuleConflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRule, setDeletingRule] = useState<Rule | null>(null);

  // Debounce timer ref for conflict detection
  const conflictDetectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRules();
    detectConflicts();
  }, []);

  // Debounced conflict detection when rules change
  useEffect(() => {
    if (rules.length > 0) {
      // Clear existing timer
      if (conflictDetectionTimer.current) {
        clearTimeout(conflictDetectionTimer.current);
      }

      // Debounce conflict detection by 1000ms
      conflictDetectionTimer.current = setTimeout(() => {
        detectConflicts();
      }, 1000);
    }

    return () => {
      if (conflictDetectionTimer.current) {
        clearTimeout(conflictDetectionTimer.current);
      }
    };
  }, [rules]);

  const loadRules = useCallback(async (): Promise<void> => {
    try {
      const loadedRules = await Storage.getRules();
      setRules(loadedRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectConflicts = useCallback(async (): Promise<void> => {
    try {
      const response = (await browser.runtime.sendMessage({
        type: 'DETECT_CONFLICTS',
      })) as { success: boolean; conflicts?: RuleConflict[] };

      if (response.success && response.conflicts) {
        setConflicts(response.conflicts);
      }
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    }
  }, []);

  const handleViewConflictRule = useCallback((ruleId: string): void => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      setEditingRule(rule);
      setShowEditor(true);
      setShowConflicts(false);
    }
  }, [rules]);

  const handleCreateRule = useCallback((): void => {
    setEditingRule(undefined);
    setShowEditor(true);
  }, []);

  const handleEditRule = useCallback((rule: Rule): void => {
    setEditingRule(rule);
    setShowEditor(true);
  }, []);

  const handleSaveRule = useCallback(async (rule: Rule): Promise<void> => {
    await Storage.saveRule(rule);
    await loadRules();
    setShowEditor(false);
    setEditingRule(undefined);
  }, [loadRules]);

  const handleCancelEdit = useCallback((): void => {
    setShowEditor(false);
    setEditingRule(undefined);
  }, []);

  const confirmDeleteRule = useCallback((rule: Rule): void => {
    setDeletingRule(rule);
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteRule = useCallback(async (): Promise<void> => {
    if (deletingRule) {
      await Storage.deleteRule(deletingRule.id);
      await loadRules();
      setShowDeleteConfirm(false);
      setDeletingRule(null);
    }
  }, [deletingRule, loadRules]);

  const handleCancelDelete = useCallback((): void => {
    setShowDeleteConfirm(false);
    setDeletingRule(null);
  }, []);

  const handleUseTemplate = useCallback((template: RuleTemplate): void => {
    // Create a new rule from the template
    const newRule: Rule = {
      ...template.rule,
      id: generateId(),
      priority: template.rule.priority || DEFAULT_RULE_PRIORITY,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setEditingRule(newRule);
    setShowEditor(true);
    setCurrentView('rules'); // Switch to rules view with editor open
  }, []);

  const toggleRule = useCallback(async (ruleId: string): Promise<void> => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updatedRule = { ...rule, enabled: !rule.enabled, updatedAt: Date.now() };
      await Storage.saveRule(updatedRule);
      await loadRules();
    }
  }, [rules, loadRules]);

  // Memoized filtered rules - only recompute when rules or searchQuery changes
  const filteredRules = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return rules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(query) ||
        rule.description?.toLowerCase().includes(query) ||
        rule.matcher.pattern.toLowerCase().includes(query)
    );
  }, [rules, searchQuery]);

  // Memoized active rules count
  const activeRulesCount = useMemo(() => {
    return rules.filter((r) => r.enabled).length;
  }, [rules]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <img src="/icons/icon64.png" alt="FlowCraft" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white">FlowCraft</h1>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">HTTP Interceptor</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setCurrentView('rules')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'rules'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="text-base">⚡</span>
            <span>HTTP Rules</span>
            <span className="ml-auto text-xs bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
              {rules.length}
            </span>
          </button>

          <button
            data-testid="templates-tab"
            onClick={() => setCurrentView('templates')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 ${
              currentView === 'templates'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="text-base">📚</span>
            <span>Templates</span>
          </button>

          <button
            data-testid="network-tab"
            onClick={() => setCurrentView('network')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 ${
              currentView === 'network'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="text-base">🌐</span>
            <span>Network</span>
          </button>

          <button
            data-testid="settings-tab"
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1 ${
              currentView === 'settings'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
            Version 1.0.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'rules' ? (
          <>
            {/* Header */}
            <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      HTTP Rules
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {activeRulesCount} of {rules.length} rules active
                    </p>
                  </div>
                  {conflicts.length > 0 && (
                    <button
                      onClick={() => setShowConflicts(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      <span>⚠️</span>
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {conflicts.length} {conflicts.length === 1 ? 'Conflict' : 'Conflicts'}
                      </span>
                    </button>
                  )}
                </div>
                <Button variant="primary" onClick={handleCreateRule} data-testid="new-rule-btn">
                  + New Rule
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  🔍
                </div>
              </div>
            </header>

            {/* Rules Table */}
            <div className="flex-1 overflow-auto p-8">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-neutral-600 dark:text-neutral-400">Loading...</div>
                </div>
              ) : filteredRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    {searchQuery ? 'No rules match your search' : 'No rules yet'}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : 'Create your first rule to start manipulating HTTP requests'}
                  </p>
                  {!searchQuery && (
                    <Button variant="primary" onClick={handleCreateRule}>
                      Create Your First Rule
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-12">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                          Pattern
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-32">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {filteredRules.map((rule) => (
                        <tr
                          key={rule.id}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleRule(rule.id)}
                              className={`w-10 h-6 rounded-full transition-colors ${
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
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">
                              {rule.name}
                            </div>
                            {rule.description && (
                              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                {rule.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
                              {rule.action.type === 'header_modification' && '⚡ Headers'}
                              {rule.action.type === 'url_redirect' && '🔄 Redirect'}
                              {rule.action.type === 'request_block' && '🚫 Block'}
                              {rule.action.type === 'script_injection' && '💉 Script'}
                              {rule.action.type === 'query_param' && '🔧 Query'}
                              {rule.action.type === 'mock_response' && '🎭 Mock'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded">
                              {rule.matcher.pattern}
                            </code>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                data-testid={`edit-rule-${rule.id}`}
                                onClick={() => handleEditRule(rule)}
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                                aria-label={`Edit ${rule.name}`}
                              >
                                Edit
                              </button>
                              <button
                                data-testid={`delete-rule-${rule.id}`}
                                onClick={() => confirmDeleteRule(rule)}
                                className="text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 text-sm font-medium"
                                aria-label={`Delete ${rule.name}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : currentView === 'templates' ? (
          /* Templates View */
          <div className="flex-1 overflow-auto p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Rule Templates
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Browse and use pre-configured rule templates for common use cases
              </p>
            </div>
            <TemplateBrowser onUseTemplate={handleUseTemplate} />
          </div>
        ) : currentView === 'network' ? (
          /* Network View */
          <NetworkView />
        ) : (
          /* Settings View */
          <SettingsView />
        )}
      </main>

      {/* Rule Editor Drawer */}
      <Drawer
        isOpen={showEditor}
        onClose={handleCancelEdit}
        title={editingRule ? 'Edit Rule' : 'Create New Rule'}
        testId="rule-editor-drawer"
      >
        <RuleEditor rule={editingRule} onSave={handleSaveRule} onCancel={handleCancelEdit} />
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Delete Rule"
        size="sm"
        testId="delete-confirm-modal"
      >
        <div className="space-y-4">
          <p className="text-neutral-700 dark:text-neutral-300">
            Are you sure you want to delete <strong>{deletingRule?.name}</strong>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancelDelete} data-testid="delete-cancel-btn">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRule} data-testid="delete-confirm-btn">
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Conflicts Modal */}
      <Modal
        isOpen={showConflicts}
        onClose={() => setShowConflicts(false)}
        title="Rule Conflicts"
        size="lg"
        testId="conflicts-modal"
      >
        <ConflictPanel
          conflicts={conflicts}
          rules={rules}
          onViewRule={handleViewConflictRule}
        />
      </Modal>
    </div>
  );
};

export default App;
