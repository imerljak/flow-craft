import React from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Rule, RuleType, UrlMatcherType, HeaderModification, QueryParamModification } from '@shared/types';
import { generateId, isValidUrl, isValidRegex } from '@shared/utils';
import { DEFAULT_RULE_PRIORITY } from '@shared/constants';
import { Button } from '../Button';
import { Input } from '../Input';
import { HeaderEditor } from './HeaderEditor';
import { QueryParamEditor } from './QueryParamEditor';

export interface RuleEditorProps {
  rule?: Rule;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

interface RuleFormData {
  name: string;
  description: string;
  pattern: string;
  patternType: UrlMatcherType;
  ruleType: RuleType;
  priority: number | string;
  redirectUrl: string;
  headers: HeaderModification[];
  params: QueryParamModification[];
}

/**
 * RuleEditor component for creating and editing rules
 */
export const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RuleFormData>({
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      pattern: rule?.matcher.pattern || '',
      patternType: rule?.matcher.type || 'exact',
      ruleType: rule?.action.type || RuleType.HEADER_MODIFICATION,
      priority: rule?.priority || DEFAULT_RULE_PRIORITY,
      redirectUrl: rule?.action.type === RuleType.URL_REDIRECT ? rule.action.redirectUrl : '',
      headers: rule?.action.type === RuleType.HEADER_MODIFICATION ? rule.action.headers : [],
      params: rule?.action.type === RuleType.QUERY_PARAM ? rule.action.params : [],
    },
    mode: 'onSubmit',
  });

  const watchedPatternType = watch('patternType');
  const watchedRuleType = watch('ruleType');

  const onSubmit: SubmitHandler<RuleFormData> = (data) => {
    // Build rule action based on type
    let action: Rule['action'];

    switch (data.ruleType) {
      case RuleType.HEADER_MODIFICATION:
        action = {
          type: RuleType.HEADER_MODIFICATION,
          headers: data.headers,
        };
        break;
      case RuleType.URL_REDIRECT:
        action = {
          type: RuleType.URL_REDIRECT,
          redirectUrl: data.redirectUrl,
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
          params: data.params,
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
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      enabled: rule?.enabled ?? true,
      priority: Number(data.priority) || DEFAULT_RULE_PRIORITY,
      matcher: {
        type: data.patternType,
        pattern: data.pattern.trim(),
      },
      action,
      createdAt: rule?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(newRule);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* Rule Name */}
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Rule name is required' }}
        render={({ field }) => (
          <Input
            {...field}
            label="Rule Name"
            placeholder="e.g., Add CORS headers"
            error={errors.name?.message}
            fullWidth
          />
        )}
      />

      {/* Description */}
      <Input
        label="Description (optional)"
        placeholder="Describe what this rule does"
        fullWidth
        {...register('description')}
      />

      {/* URL Pattern */}
      <Controller
        name="pattern"
        control={control}
        rules={{
          required: 'URL pattern is required',
          validate: (value) => {
            if (watchedPatternType === 'exact' || watchedPatternType === 'wildcard') {
              if (!value.includes('*') && !isValidUrl(value)) {
                return 'Invalid URL format';
              }
            } else if (watchedPatternType === 'regex') {
              if (!isValidRegex(value)) {
                return 'Invalid regex pattern';
              }
            }
            return true;
          }
        }}
        render={({ field }) => (
          <Input
            {...field}
            label="URL Pattern"
            placeholder="https://api.example.com/*"
            error={errors.pattern?.message}
            helperText={
              watchedPatternType === 'regex'
                ? 'Enter a regular expression'
                : watchedPatternType === 'wildcard'
                  ? 'Use * as wildcard'
                  : 'Enter exact URL'
            }
            fullWidth
          />
        )}
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
          className="block px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          {...register('patternType')}
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
          className="block px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          {...register('ruleType')}
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
        helperText="Lower number = higher priority (1 is highest)"
        min={1}
        max={1000}
        {...register('priority', { valueAsNumber: true })}
      />

      {/* Conditional Fields Based on Rule Type */}
      {watchedRuleType === RuleType.URL_REDIRECT && (
        <Controller
          name="redirectUrl"
          control={control}
          rules={{
            required: 'Redirect URL is required',
            validate: (value) => isValidUrl(value) || 'Invalid redirect URL format'
          }}
          render={({ field }) => (
            <Input
              {...field}
              label="Redirect URL"
              placeholder="https://new.example.com"
              error={errors.redirectUrl?.message}
              fullWidth
            />
          )}
        />
      )}

      {watchedRuleType === RuleType.HEADER_MODIFICATION && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Headers
          </label>
          <Controller
            control={control}
            name="headers"
            render={({ field }) => (
              <HeaderEditor
                headers={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      )}

      {watchedRuleType === RuleType.QUERY_PARAM && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Query Parameters
          </label>
          <Controller
            control={control}
            name="params"
            render={({ field }) => (
              <QueryParamEditor
                params={field.value}
                onChange={field.onChange}
              />
            )}
          />
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
