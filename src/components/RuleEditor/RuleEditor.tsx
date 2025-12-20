import React, { useState } from 'react';
import { Rule, RuleType, UrlMatcherType, HeaderModification } from '@shared/types';
import { generateId, isValidUrl, isValidRegex } from '@shared/utils';
import { DEFAULT_RULE_PRIORITY } from '@shared/constants';
import { Button } from '../Button';
import { Input } from '../Input';
import { HeaderEditor } from './HeaderEditor';

export interface RuleEditorProps {
  rule?: Rule;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  pattern?: string;
  redirectUrl?: string;
}

/**
 * RuleEditor component for creating and editing rules
 */
export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
  // Form state
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [pattern, setPattern] = useState(rule?.matcher.pattern || '');
  const [patternType, setPatternType] = useState<UrlMatcherType>(
    rule?.matcher.type || 'exact'
  );
  const [ruleType, setRuleType] = useState<RuleType>(
    rule?.action.type || RuleType.HEADER_MODIFICATION
  );
  const [priority, setPriority] = useState(rule?.priority || DEFAULT_RULE_PRIORITY);
  const [redirectUrl, setRedirectUrl] = useState(
    rule?.action.type === RuleType.URL_REDIRECT ? rule.action.redirectUrl : ''
  );
  const [headers, setHeaders] = useState<HeaderModification[]>(
    rule?.action.type === RuleType.HEADER_MODIFICATION ? rule.action.headers : []
  );

  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    // Validate pattern
    if (!pattern.trim()) {
      newErrors.pattern = 'URL pattern is required';
    } else if (patternType === 'exact' || patternType === 'wildcard') {
      // For exact and wildcard, check if it's a valid URL or URL pattern
      if (!pattern.includes('*') && !isValidUrl(pattern)) {
        newErrors.pattern = 'Invalid URL format';
      }
    } else if (patternType === 'regex') {
      // For regex, validate the regex pattern
      if (!isValidRegex(pattern)) {
        newErrors.pattern = 'Invalid regex pattern';
      }
    }

    // Validate redirect URL for redirect rules
    if (ruleType === RuleType.URL_REDIRECT) {
      if (!redirectUrl.trim()) {
        newErrors.redirectUrl = 'Redirect URL is required';
      } else if (!isValidUrl(redirectUrl)) {
        newErrors.redirectUrl = 'Invalid redirect URL format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Build rule action based on type
    let action: Rule['action'];

    switch (ruleType) {
      case RuleType.HEADER_MODIFICATION:
        action = {
          type: RuleType.HEADER_MODIFICATION,
          headers,
        };
        break;
      case RuleType.URL_REDIRECT:
        action = {
          type: RuleType.URL_REDIRECT,
          redirectUrl,
        };
        break;
      case RuleType.REQUEST_BLOCK:
        action = {
          type: RuleType.REQUEST_BLOCK,
        };
        break;
      case RuleType.SCRIPT_INJECTION:
        action = {
          type: RuleType.SCRIPT_INJECTION,
          script: {
            code: '',
            runAt: 'document_end',
          },
        };
        break;
      case RuleType.QUERY_PARAM:
        action = {
          type: RuleType.QUERY_PARAM,
          params: [],
        };
        break;
      case RuleType.MOCK_RESPONSE:
        action = {
          type: RuleType.MOCK_RESPONSE,
          mockResponse: {
            statusCode: 200,
            headers: {},
          },
        };
        break;
      default:
        return;
    }

    const newRule: Rule = {
      id: rule?.id || generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      enabled: rule?.enabled ?? true,
      priority,
      matcher: {
        type: patternType,
        pattern: pattern.trim(),
      },
      action,
      createdAt: rule?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(newRule);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rule Name */}
      <Input
        label="Rule Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Add CORS headers"
        error={errors.name}
        fullWidth
        required
      />

      {/* Description */}
      <Input
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what this rule does"
        fullWidth
      />

      {/* URL Pattern */}
      <Input
        label="URL Pattern"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
        placeholder="https://api.example.com/*"
        error={errors.pattern}
        helperText={
          patternType === 'regex'
            ? 'Enter a regular expression'
            : patternType === 'wildcard'
              ? 'Use * as wildcard'
              : 'Enter exact URL'
        }
        fullWidth
        required
      />

      {/* Pattern Type */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="pattern-type"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Pattern Type
        </label>
        <select
          id="pattern-type"
          value={patternType}
          onChange={(e) => setPatternType(e.target.value as UrlMatcherType)}
          className="block px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="exact">Exact Match</option>
          <option value="wildcard">Wildcard (*)</option>
          <option value="regex">Regular Expression</option>
        </select>
      </div>

      {/* Rule Type */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="rule-type"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Rule Type
        </label>
        <select
          id="rule-type"
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as RuleType)}
          className="block px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={RuleType.HEADER_MODIFICATION}>Header Modification</option>
          <option value={RuleType.URL_REDIRECT}>URL Redirection</option>
          <option value={RuleType.REQUEST_BLOCK}>Block Request</option>
          <option value={RuleType.SCRIPT_INJECTION}>Script Injection</option>
          <option value={RuleType.QUERY_PARAM}>Query Parameter</option>
          <option value={RuleType.MOCK_RESPONSE}>Mock Response</option>
        </select>
      </div>

      {/* Priority */}
      <Input
        label="Priority"
        type="number"
        value={priority}
        onChange={(e) => setPriority(parseInt(e.target.value) || DEFAULT_RULE_PRIORITY)}
        helperText="Lower number = higher priority (1 is highest)"
        min={1}
        max={1000}
      />

      {/* Conditional Fields Based on Rule Type */}
      {ruleType === RuleType.URL_REDIRECT && (
        <Input
          label="Redirect URL"
          value={redirectUrl}
          onChange={(e) => setRedirectUrl(e.target.value)}
          placeholder="https://new.example.com"
          error={errors.redirectUrl}
          fullWidth
          required
        />
      )}

      {ruleType === RuleType.HEADER_MODIFICATION && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Headers
          </label>
          <HeaderEditor headers={headers} onChange={setHeaders} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Rule
        </Button>
      </div>
    </form>
  );
};
