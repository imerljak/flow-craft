/**
 * Script Injection Editor Component
 * Allows users to configure script injection settings
 */

import { ScriptInjection } from '@shared/types';
import { JSX } from 'react';

interface ScriptInjectionEditorProps {
  script: ScriptInjection;
  onChange: (script: ScriptInjection) => void;
}

export const ScriptInjectionEditor = ({
  script,
  onChange,
}: ScriptInjectionEditorProps): JSX.Element => {
  const handleCodeChange = (value: string): void => {
    onChange({
      ...script,
      code: value,
    });
  };

  const handleRunAtChange = (value: ScriptInjection['runAt']): void => {
    onChange({
      ...script,
      runAt: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Run At Timing */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Injection Timing
        </label>
        <select
          data-testid="script-timing-select"
          value={script.runAt}
          onChange={(e) =>
            handleRunAtChange(e.target.value as ScriptInjection['runAt'])
          }
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="document_start">Document Start (Before DOM)</option>
          <option value="document_end">Document End (After DOM)</option>
          <option value="document_idle">Document Idle (After Load)</option>
        </select>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          When should the script be injected?
        </p>
      </div>

      {/* Script Code */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          JavaScript Code
        </label>
        <textarea
          data-testid="script-code-textarea"
          value={script.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="// Enter JavaScript code to inject
console.log('FlowCraft script injected!');
document.body.style.backgroundColor = '#f0f0f0';"
          rows={10}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
        />
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          JavaScript code that will be injected into matching pages
        </p>
      </div>

      {/* Warning */}
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>Security Warning:</strong> Script injection can be powerful
          but also risky. Only inject scripts into domains you trust and own.
          Avoid injecting sensitive data or credentials.
        </p>
      </div>
    </div>
  );
};
