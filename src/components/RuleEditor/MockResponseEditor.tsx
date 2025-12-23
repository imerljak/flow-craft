/**
 * Mock Response Editor Component
 * Allows users to configure mock HTTP responses
 */

import { MockResponse } from '@shared/types';
import { Input } from '@components/Input/Input';
import { useState } from 'react';
import { Description, Field, Label, Textarea } from '@headlessui/react';

interface MockResponseEditorProps {
  mockResponse: MockResponse;
  onChange: (mockResponse: MockResponse) => void;
}

export const MockResponseEditor = ({
  mockResponse,
  onChange,
}: MockResponseEditorProps) => {
  const [newHeaderName, setNewHeaderName] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const handleStatusCodeChange = (value: string) => {
    const statusCode = parseInt(value, 10);
    if (!isNaN(statusCode)) {
      onChange({
        ...mockResponse,
        statusCode,
      });
    }
  };

  const handleStatusTextChange = (value: string) => {
    onChange({
      ...mockResponse,
      statusText: value,
    });
  };

  const handleBodyChange = (value: string) => {
    onChange({
      ...mockResponse,
      body: value,
    });
  };

  const handleDelayChange = (value: string) => {
    const delay = parseInt(value, 10);
    onChange({
      ...mockResponse,
      delay: isNaN(delay) ? undefined : delay,
    });
  };

  const handleAddHeader = () => {
    if (newHeaderName && newHeaderValue) {
      onChange({
        ...mockResponse,
        headers: {
          ...mockResponse.headers,
          [newHeaderName]: newHeaderValue,
        },
      });
      setNewHeaderName('');
      setNewHeaderValue('');
    }
  };

  const handleRemoveHeader = (name: string) => {
    const { [name]: _, ...remainingHeaders } = mockResponse.headers;
    onChange({
      ...mockResponse,
      headers: remainingHeaders,
    });
  };

  return (
    <div className="space-y-4">
      {/* Status Code */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            data-testid="status-code-input"
            label="Status Code"
            type="number"
            value={mockResponse.statusCode.toString()}
            onChange={(e) => handleStatusCodeChange(e.target.value)}
            placeholder="200"
            min="100"
            max="599"
          />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            HTTP status code (100-599)
          </p>
        </div>

        <div>
          <Input
            data-testid="status-text-input"
            label="Status Text (Optional)"
            value={mockResponse.statusText || ''}
            onChange={(e) => handleStatusTextChange(e.target.value)}
            placeholder="OK"
          />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            e.g., OK, Not Found, Internal Server Error
          </p>
        </div>
      </div>

      {/* Response Headers */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Response Headers
        </label>

        {/* Existing Headers */}
        {Object.keys(mockResponse.headers).length > 0 && (
          <div className="space-y-2 mb-3">
            {Object.entries(mockResponse.headers).map(([name, value]) => (
              <div
                key={name}
                className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
              >
                <span className="flex-1 text-sm font-mono text-neutral-900 dark:text-neutral-100">
                  {name}: {value}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(name)}
                  className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-sm"
                  aria-label={`Remove ${name} header`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Header */}
        <div className="flex gap-2">
          <input
            data-testid="header-name-input"
            type="text"
            value={newHeaderName}
            onChange={(e) => setNewHeaderName(e.target.value)}
            placeholder="Header name"
            className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            data-testid="header-value-input"
            type="text"
            value={newHeaderValue}
            onChange={(e) => setNewHeaderValue(e.target.value)}
            placeholder="Header value"
            className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            data-testid="add-header-btn"
            type="button"
            onClick={handleAddHeader}
            disabled={!newHeaderName || !newHeaderValue}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Response Body */}
      <Field>
        <Label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Response Body (Optional)
        </Label>
        <Textarea
          data-testid="response-body-textarea"
          value={mockResponse.body || ''}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder='{"message": "This is a mock response", "data": []}'
          rows={8}
          maxLength={50_000}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
        />
        <Description className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Response body content (JSON, HTML, text, etc.)
        </Description>
      </Field>

      {/* Delay */}
      <Field>
        <Input
          data-testid="response-delay-input"
          label="Response Delay (Optional)"
          type="number"
          value={mockResponse.delay?.toString() || ''}
          onChange={(e) => handleDelayChange(e.target.value)}
          placeholder="0"
          min="0"
          max="10000"
        />
        <Description className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Delay in milliseconds before sending response (max 10 seconds)
        </Description>
      </Field>

      {/* Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <strong>Note:</strong> Mock responses replace actual server responses.
          Useful for testing error states, offline scenarios, or developing without a backend.
        </p>
      </div>
    </div>
  );
};
