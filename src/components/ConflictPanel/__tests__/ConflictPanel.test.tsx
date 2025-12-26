/**
 * Tests for ConflictPanel Component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConflictPanel } from '../ConflictPanel';
import { RuleConflict, ConflictSeverity, ConflictType, Rule, RuleType } from '@shared/types';

const mockRules: Rule[] = [
  {
    id: 'rule-1',
    name: 'Test Rule 1',
    description: 'First test rule',
    enabled: true,
    priority: 10,
    matcher: { type: 'exact', pattern: 'https://example.com' },
    action: { type: RuleType.REQUEST_BLOCK },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'rule-2',
    name: 'Test Rule 2',
    description: 'Second test rule',
    enabled: true,
    priority: 10,
    matcher: { type: 'exact', pattern: 'https://example.com' },
    action: { type: RuleType.URL_REDIRECT, redirectUrl: 'https://other.com' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('ConflictPanel', () => {
  it('should render without conflicts', () => {
    render(<ConflictPanel conflicts={[]} rules={mockRules} />);
    expect(screen.getByText('No Conflicts Detected')).toBeInTheDocument();
  });

  it('should render error severity conflict', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-1',
        type: ConflictType.ACTION_CONFLICT,
        severity: ConflictSeverity.ERROR,
        ruleIds: ['rule-1', 'rule-2'],
        message: 'Cannot block and redirect the same request',
        description: 'These rules have conflicting actions',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText(/Action Conflict/)).toBeInTheDocument();
    expect(screen.getByText(/Cannot block and redirect/)).toBeInTheDocument();
    expect(screen.getByText('🔴')).toBeInTheDocument(); // Error icon
  });

  it('should render warning severity conflict', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-2',
        type: ConflictType.SHADOWING,
        severity: ConflictSeverity.WARNING,
        ruleIds: ['rule-1', 'rule-2'],
        message: 'Rule may be shadowed by higher priority rule',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText(/Shadowing/)).toBeInTheDocument();
    expect(screen.getByText(/may be shadowed/)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // Warning icon
  });

  it('should render info severity conflict', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-3',
        type: ConflictType.REDUNDANT,
        severity: ConflictSeverity.INFO,
        ruleIds: ['rule-1'],
        message: 'This rule may be redundant',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText(/Redundant/)).toBeInTheDocument();
    expect(screen.getByText(/may be redundant/)).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument(); // Info icon
  });

  it('should display rule names', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-1',
        type: ConflictType.PATTERN_OVERLAP,
        severity: ConflictSeverity.WARNING,
        ruleIds: ['rule-1', 'rule-2'],
        message: 'Patterns overlap',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText('Test Rule 1')).toBeInTheDocument();
    expect(screen.getByText('Test Rule 2')).toBeInTheDocument();
  });

  it('should handle unknown rule IDs gracefully', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-1',
        type: ConflictType.PATTERN_OVERLAP,
        severity: ConflictSeverity.WARNING,
        ruleIds: ['unknown-rule-id'],
        message: 'Test conflict',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText('Unknown Rule')).toBeInTheDocument();
  });

  it('should group conflicts by severity', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'error-1',
        type: ConflictType.ACTION_CONFLICT,
        severity: ConflictSeverity.ERROR,
        ruleIds: ['rule-1'],
        message: 'Error conflict',
      },
      {
        id: 'warning-1',
        type: ConflictType.SHADOWING,
        severity: ConflictSeverity.WARNING,
        ruleIds: ['rule-1'],
        message: 'Warning conflict',
      },
      {
        id: 'info-1',
        type: ConflictType.REDUNDANT,
        severity: ConflictSeverity.INFO,
        ruleIds: ['rule-1'],
        message: 'Info conflict',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    // All severities should be displayed
    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('should call onViewRule when clicking rule name', () => {
    const onViewRule = vi.fn();
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-1',
        type: ConflictType.PATTERN_OVERLAP,
        severity: ConflictSeverity.WARNING,
        ruleIds: ['rule-1'],
        message: 'Test conflict',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} onViewRule={onViewRule} />);

    const ruleButton = screen.getByText('Test Rule 1');
    ruleButton.click();

    expect(onViewRule).toHaveBeenCalledWith('rule-1');
  });

  it('should apply custom className', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-1',
        type: ConflictType.PATTERN_OVERLAP,
        severity: ConflictSeverity.WARNING,
        ruleIds: ['rule-1'],
        message: 'Test conflict',
      },
    ];

    const { container } = render(
      <ConflictPanel conflicts={conflicts} rules={mockRules} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should display conflict message', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'conflict-1',
        type: ConflictType.ACTION_CONFLICT,
        severity: ConflictSeverity.ERROR,
        ruleIds: ['rule-1'],
        message: 'This is the conflict message',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText(/conflict message/)).toBeInTheDocument();
  });

  it('should render multiple conflicts of same severity', () => {
    const conflicts: RuleConflict[] = [
      {
        id: 'error-1',
        type: ConflictType.ACTION_CONFLICT,
        severity: ConflictSeverity.ERROR,
        ruleIds: ['rule-1'],
        message: 'First error',
      },
      {
        id: 'error-2',
        type: ConflictType.PRIORITY_CONFLICT,
        severity: ConflictSeverity.ERROR,
        ruleIds: ['rule-2'],
        message: 'Second error',
      },
    ];

    render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);

    expect(screen.getByText(/First error/)).toBeInTheDocument();
    expect(screen.getByText(/Second error/)).toBeInTheDocument();
  });

  it('should display all conflict type labels correctly', () => {
    const conflictTypes = [
      { type: ConflictType.PATTERN_OVERLAP, label: 'Pattern Overlap' },
      { type: ConflictType.ACTION_CONFLICT, label: 'Action Conflict' },
      { type: ConflictType.PRIORITY_CONFLICT, label: 'Priority Conflict' },
      { type: ConflictType.HEADER_CONFLICT, label: 'Header Conflict' },
      { type: ConflictType.SHADOWING, label: 'Shadowing' },
      { type: ConflictType.REDUNDANT, label: 'Redundant' },
    ];

    conflictTypes.forEach(({ type, label }) => {
      const conflicts: RuleConflict[] = [
        {
          id: `conflict-${type}`,
          type,
          severity: ConflictSeverity.INFO,
          ruleIds: ['rule-1'],
          message: `Test ${type}`,
        },
      ];

      const { unmount } = render(<ConflictPanel conflicts={conflicts} rules={mockRules} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });
});
