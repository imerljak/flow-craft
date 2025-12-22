/**
 * Query Parameter Editor Component
 * Allows users to add, modify, or remove query parameters
 */

import { QueryParamModification } from '@shared/types';
import { Button } from '@components/Button/Button';

interface QueryParamEditorProps {
  params: QueryParamModification[];
  onChange: (params: QueryParamModification[]) => void;
}

export const QueryParamEditor = ({ params, onChange }: QueryParamEditorProps) => {
  const handleAddParam = () => {
    onChange([
      ...params,
      {
        operation: 'add',
        name: '',
        value: '',
      },
    ]);
  };

  const handleRemoveParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    onChange(newParams);
  };

  const handleUpdateParam = (
    index: number,
    field: keyof QueryParamModification,
    value: string
  ) => {
    const newParams = [...params];
    const param = newParams[index];
    if (param) {
      newParams[index] = { ...param, [field]: value };
      onChange(newParams);
    }
  };

  return (
    <div className="space-y-3">
      {params.length === 0 ? (
        <div className="text-sm text-neutral-500 dark:text-neutral-400 py-4 text-center border border-dashed border-neutral-300 dark:border-neutral-600 rounded">
          No query parameters configured. Click "Add Parameter" to get started.
        </div>
      ) : (
        params.map((param, index) => (
          <div
            key={index}
            data-testid={`param-row-${index}`}
            className="flex gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex-1 grid grid-cols-3 gap-2">
              {/* Operation */}
              <select
                data-testid={`param-operation-${index}`}
                value={param.operation}
                onChange={(e) =>
                  handleUpdateParam(index, 'operation', e.target.value)
                }
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="add">Add</option>
                <option value="modify">Modify</option>
                <option value="remove">Remove</option>
              </select>

              {/* Name */}
              <input
                data-testid={`param-name-${index}`}
                type="text"
                value={param.name}
                onChange={(e) => handleUpdateParam(index, 'name', e.target.value)}
                placeholder="Parameter name"
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Value - only for add/modify operations */}
              {param.operation !== 'remove' && (
                <input
                  data-testid={`param-value-${index}`}
                  type="text"
                  value={param.value || ''}
                  onChange={(e) =>
                    handleUpdateParam(index, 'value', e.target.value)
                  }
                  placeholder="Parameter value"
                  className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemoveParam(index)}
              className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Remove parameter"
            >
              ×
            </button>
          </div>
        ))
      )}

      <Button type="button" variant="secondary" onClick={handleAddParam} data-testid="add-param-btn">
        Add Parameter
      </Button>
    </div>
  );
};
