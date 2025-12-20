import React from 'react';
import { HeaderModification, HeaderOperation } from '@shared/types';
import { Button } from '../Button';
import { Input } from '../Input';

export interface HeaderEditorProps {
  headers: HeaderModification[];
  onChange: (headers: HeaderModification[]) => void;
}

/**
 * HeaderEditor component for managing header modifications
 */
export const HeaderEditor: React.FC<HeaderEditorProps> = ({ headers, onChange }) => {
  /**
   * Add a new header
   */
  const handleAddHeader = (): void => {
    onChange([
      ...headers,
      {
        operation: HeaderOperation.ADD,
        name: '',
        value: '',
      },
    ]);
  };

  /**
   * Update a header at index
   */
  const handleUpdateHeader = (index: number, updated: HeaderModification): void => {
    const newHeaders = [...headers];
    newHeaders[index] = updated;
    onChange(newHeaders);
  };

  /**
   * Remove a header at index
   */
  const handleRemoveHeader = (index: number): void => {
    onChange(headers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {headers.map((header, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700"
        >
          {/* Operation Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Operation
            </label>
            <select
              value={header.operation}
              onChange={(e) =>
                handleUpdateHeader(index, {
                  ...header,
                  operation: e.target.value as HeaderOperation,
                })
              }
              className="block px-2 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded text-xs bg-white dark:bg-neutral-900 dark:text-white"
            >
              <option value={HeaderOperation.ADD}>Add</option>
              <option value={HeaderOperation.MODIFY}>Modify</option>
              <option value={HeaderOperation.REMOVE}>Remove</option>
            </select>
          </div>

          {/* Header Name */}
          <Input
            label="Header Name"
            value={header.name}
            onChange={(e) =>
              handleUpdateHeader(index, {
                ...header,
                name: e.target.value,
              })
            }
            placeholder="e.g., Authorization"
            fullWidth
          />

          {/* Header Value (not shown for REMOVE operation) */}
          {header.operation !== HeaderOperation.REMOVE && (
            <Input
              label="Header Value"
              value={header.value || ''}
              onChange={(e) =>
                handleUpdateHeader(index, {
                  ...header,
                  value: e.target.value,
                })
              }
              placeholder="e.g., Bearer token123"
              fullWidth
            />
          )}

          {/* Remove Button */}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => handleRemoveHeader(index)}
          >
            Remove Header
          </Button>
        </div>
      ))}

      {/* Add Header Button */}
      <Button type="button" variant="secondary" size="sm" onClick={handleAddHeader} fullWidth>
        + Add Header
      </Button>

      {headers.length === 0 && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center py-2">
          No headers configured. Click &quot;Add Header&quot; to get started.
        </p>
      )}
    </div>
  );
};
