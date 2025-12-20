import React, { useEffect, useState } from 'react';
import { Rule } from '@shared/types';
import { Storage } from '@storage/index';
import { Modal } from '@components/Modal';
import { RuleEditor } from '@components/RuleEditor';
import { Button } from '@components/Button';

/**
 * Main popup application component
 */
const App: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRule, setDeletingRule] = useState<Rule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  /**
   * Load rules from storage
   */
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

  /**
   * Toggle rule enabled/disabled
   */
  const toggleRule = async (ruleId: string): Promise<void> => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      const updatedRule = { ...rule, enabled: !rule.enabled, updatedAt: Date.now() };
      await Storage.saveRule(updatedRule);
      await loadRules();
    }
  };

  /**
   * Open editor to create new rule
   */
  const handleCreateRule = (): void => {
    setEditingRule(undefined);
    setShowEditor(true);
  };

  /**
   * Open editor to edit existing rule
   */
  const handleEditRule = (rule: Rule): void => {
    setEditingRule(rule);
    setShowEditor(true);
  };

  /**
   * Save rule (create or update)
   */
  const handleSaveRule = async (rule: Rule): Promise<void> => {
    try {
      await Storage.saveRule(rule);
      await loadRules();
      setShowEditor(false);
      setEditingRule(undefined);
    } catch (error) {
      console.error('Failed to save rule:', error);
      alert('Failed to save rule. Please try again.');
    }
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = (): void => {
    setShowEditor(false);
    setEditingRule(undefined);
  };

  /**
   * Confirm delete rule
   */
  const handleConfirmDelete = (rule: Rule): void => {
    setDeletingRule(rule);
    setShowDeleteConfirm(true);
  };

  /**
   * Delete rule
   */
  const handleDeleteRule = async (): Promise<void> => {
    if (deletingRule) {
      try {
        await Storage.deleteRule(deletingRule.id);
        await loadRules();
        setShowDeleteConfirm(false);
        setDeletingRule(null);
      } catch (error) {
        console.error('Failed to delete rule:', error);
        alert('Failed to delete rule. Please try again.');
      }
    }
  };

  /**
   * Cancel delete
   */
  const handleCancelDelete = (): void => {
    setShowDeleteConfirm(false);
    setDeletingRule(null);
  };

  /**
   * Open options page
   */
  const handleOpenSettings = (): void => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="w-[600px] h-[500px] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Loading rules...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-[600px] h-[500px] bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">FlowCraft</h1>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Privacy-first HTTP manipulation toolkit
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreateRule}>
            + New Rule
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin">
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
              <Button variant="primary" onClick={handleCreateRule}>
                Create Your First Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Toggle and Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`flex-shrink-0 mt-0.5 w-10 h-6 rounded-full transition-colors ${
                          rule.enabled ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}
                        aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            rule.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      {/* Rule Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {rule.name}
                        </h3>
                        {rule.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                            {rule.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                            {rule.matcher.pattern}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded flex-shrink-0">
                            {rule.matcher.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded">
                        {rule.action.type.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="text-neutral-500 hover:text-primary-500 transition-colors"
                        aria-label="Edit rule"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(rule)}
                        className="text-neutral-500 hover:text-error-500 transition-colors"
                        aria-label="Delete rule"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
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
            {rules.filter((r) => r.enabled).length} of {rules.length} active
          </div>
          <button
            onClick={handleOpenSettings}
            className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            Open Settings
          </button>
        </footer>
      </div>

      {/* Rule Editor Modal */}
      <Modal
        isOpen={showEditor}
        onClose={handleCancelEdit}
        title={editingRule ? 'Edit Rule' : 'Create New Rule'}
        size="lg"
      >
        <RuleEditor rule={editingRule} onSave={handleSaveRule} onCancel={handleCancelEdit} />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Delete Rule"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Are you sure you want to delete &quot;{deletingRule?.name}&quot;? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRule}>
              Delete Rule
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default App;
