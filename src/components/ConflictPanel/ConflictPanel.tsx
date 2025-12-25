/**
 * ConflictPanel Component
 * Displays rule conflicts with severity-based styling
 */

import React from 'react';
import { RuleConflict, ConflictSeverity, ConflictType, Rule } from '@shared/types';

interface ConflictPanelProps {
  conflicts: RuleConflict[];
  rules: Rule[];
  onResolve?: (conflictId: string) => void;
  onViewRule?: (ruleId: string) => void;
  className?: string;
}

const SEVERITY_ICONS: Record<ConflictSeverity, string> = {
  [ConflictSeverity.ERROR]: '🔴',
  [ConflictSeverity.WARNING]: '⚠️',
  [ConflictSeverity.INFO]: 'ℹ️',
};

const SEVERITY_COLORS: Record<
  ConflictSeverity,
  { bg: string; border: string; text: string; badge: string }
> = {
  [ConflictSeverity.ERROR]: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    border: 'border-error-300 dark:border-error-700',
    text: 'text-error-900 dark:text-error-100',
    badge: 'bg-error-100 dark:bg-error-900/40 text-error-800 dark:text-error-200',
  },
  [ConflictSeverity.WARNING]: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-900 dark:text-amber-100',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
  },
  [ConflictSeverity.INFO]: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-900 dark:text-blue-100',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
  },
};

const TYPE_LABELS: Record<ConflictType, string> = {
  [ConflictType.PATTERN_OVERLAP]: 'Pattern Overlap',
  [ConflictType.ACTION_CONFLICT]: 'Action Conflict',
  [ConflictType.PRIORITY_CONFLICT]: 'Priority Conflict',
  [ConflictType.HEADER_CONFLICT]: 'Header Conflict',
  [ConflictType.SHADOWING]: 'Shadowing',
  [ConflictType.REDUNDANT]: 'Redundant',
};

export const ConflictPanel: React.FC<ConflictPanelProps> = ({
  conflicts,
  rules,
  onViewRule,
  className = '',
}) => {
  // Group conflicts by severity
  const errorConflicts = conflicts.filter((c) => c.severity === ConflictSeverity.ERROR);
  const warningConflicts = conflicts.filter((c) => c.severity === ConflictSeverity.WARNING);
  const infoConflicts = conflicts.filter((c) => c.severity === ConflictSeverity.INFO);

  const getRuleName = (ruleId: string): string => {
    const rule = rules.find((r) => r.id === ruleId);
    return rule?.name || 'Unknown Rule';
  };

  const renderConflict = (conflict: RuleConflict) => {
    const colors = SEVERITY_COLORS[conflict.severity];

    return (
      <div
        key={conflict.id}
        className={`border rounded-lg p-4 ${colors.bg} ${colors.border} ${className}`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl flex-shrink-0">{SEVERITY_ICONS[conflict.severity]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
                {TYPE_LABELS[conflict.type]}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
                {conflict.severity.toUpperCase()}
              </span>
            </div>
            <p className={`text-sm font-medium ${colors.text}`}>{conflict.message}</p>
          </div>
        </div>

        {/* Affected Rules */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Affected Rules:
          </p>
          <div className="flex flex-wrap gap-2">
            {conflict.ruleIds.map((ruleId) => (
              <button
                key={ruleId}
                onClick={() => onViewRule?.(ruleId)}
                className="text-xs px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
              >
                {getRuleName(ruleId)}
              </button>
            ))}
          </div>
        </div>

        {/* Suggestion */}
        {conflict.suggestion && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Suggestion:
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{conflict.suggestion}</p>
          </div>
        )}

        {/* Details */}
        {conflict.details && (
          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            {conflict.details.overlappingPattern && (
              <div>
                <span className="font-semibold">Pattern: </span>
                <code className="bg-neutral-200 dark:bg-neutral-700 px-1 rounded">
                  {conflict.details.overlappingPattern}
                </code>
              </div>
            )}
            {conflict.details.conflictingHeaders && (
              <div>
                <span className="font-semibold">Headers: </span>
                {conflict.details.conflictingHeaders.join(', ')}
              </div>
            )}
            {conflict.details.priority !== undefined && (
              <div>
                <span className="font-semibold">Priority: </span>
                {conflict.details.priority}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (conflicts.length === 0) {
    return (
      <div className="bg-success-50 dark:bg-success-900/20 border border-success-300 dark:border-success-700 rounded-lg p-6 text-center">
        <span className="text-4xl mb-3 block">✅</span>
        <h3 className="text-lg font-semibold text-success-900 dark:text-success-100 mb-2">
          No Conflicts Detected
        </h3>
        <p className="text-sm text-success-700 dark:text-success-300">
          All your rules are compatible and working as expected.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
          Conflict Summary
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-error-600 dark:text-error-400">
              {errorConflicts.length}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Errors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {warningConflicts.length}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {infoConflicts.length}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Info</div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {errorConflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            Critical Errors ({errorConflicts.length})
          </h4>
          <div className="space-y-3">{errorConflicts.map(renderConflict)}</div>
        </div>
      )}

      {/* Warnings */}
      {warningConflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            Warnings ({warningConflicts.length})
          </h4>
          <div className="space-y-3">{warningConflicts.map(renderConflict)}</div>
        </div>
      )}

      {/* Info */}
      {infoConflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            Suggestions ({infoConflicts.length})
          </h4>
          <div className="space-y-3">{infoConflicts.map(renderConflict)}</div>
        </div>
      )}
    </div>
  );
};
