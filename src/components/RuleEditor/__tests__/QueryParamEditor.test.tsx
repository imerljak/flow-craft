/**
 * QueryParamEditor component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryParamEditor } from '../QueryParamEditor';

describe('QueryParamEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show empty state message when no parameters exist', () => {
      render(<QueryParamEditor params={[]} onChange={mockOnChange} />);

      expect(screen.getByText(/no query parameters configured/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add parameter/i })).toBeInTheDocument();
    });

    it('should not show empty state when parameters exist', () => {
      render(
        <QueryParamEditor
          params={[{ operation: 'add', name: 'utm_source', value: 'google' }]}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/no query parameters configured/i)).not.toBeInTheDocument();
    });
  });

  describe('Adding Parameters', () => {
    it('should add a new parameter when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<QueryParamEditor params={[]} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: /add parameter/i });
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          operation: 'add',
          name: '',
          value: '',
        },
      ]);
    });

    it('should append to existing parameters when adding', async () => {
      const user = userEvent.setup();
      const existingParams = [
        { operation: 'add' as const, name: 'existing', value: 'value' },
      ];

      render(<QueryParamEditor params={existingParams} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: /add parameter/i });
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        ...existingParams,
        {
          operation: 'add',
          name: '',
          value: '',
        },
      ]);
    });
  });

  describe('Removing Parameters', () => {
    it('should remove a parameter when remove button is clicked', async () => {
      const user = userEvent.setup();
      const params = [
        { operation: 'add' as const, name: 'param1', value: 'value1' },
        { operation: 'add' as const, name: 'param2', value: 'value2' },
      ];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove parameter/i });
      await user.click(removeButtons[0]!);

      expect(mockOnChange).toHaveBeenCalledWith([params[1]]);
    });
  });

  describe('Updating Parameter Operation', () => {
    it('should update operation type when select changes', async () => {
      const user = userEvent.setup();
      const params = [{ operation: 'add' as const, name: 'test', value: 'value' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      const operationSelect = screen.getByDisplayValue('Add');
      await user.selectOptions(operationSelect, 'modify');

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          operation: 'modify',
          name: 'test',
          value: 'value',
        },
      ]);
    });

    it('should update to remove operation', async () => {
      const user = userEvent.setup();
      const params = [{ operation: 'add' as const, name: 'test', value: 'value' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      const operationSelect = screen.getByDisplayValue('Add');
      await user.selectOptions(operationSelect, 'remove');

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          operation: 'remove',
          name: 'test',
          value: 'value',
        },
      ]);
    });
  });

  describe('Updating Parameter Name', () => {
    it('should call onChange when parameter name changes', async () => {
      const user = userEvent.setup();
      const params = [{ operation: 'add' as const, name: '', value: '' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., utm_source/i);
      await user.type(nameInput, 'X');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Updating Parameter Value', () => {
    it('should call onChange when parameter value changes', async () => {
      const user = userEvent.setup();
      const params = [{ operation: 'add' as const, name: 'source', value: '' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      const valueInput = screen.getByPlaceholderText(/e\.g\., google/i);
      await user.type(valueInput, 'X');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Conditional Rendering', () => {
    it('should show value input for add operation', () => {
      const params = [{ operation: 'add' as const, name: 'test', value: 'value' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText(/e\.g\., google/i)).toBeInTheDocument();
    });

    it('should show value input for modify operation', () => {
      const params = [{ operation: 'modify' as const, name: 'test', value: 'value' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText(/e\.g\., google/i)).toBeInTheDocument();
    });

    it('should NOT show value input for remove operation', () => {
      const params = [{ operation: 'remove' as const, name: 'test' }];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      expect(screen.queryByPlaceholderText(/e\.g\., google/i)).not.toBeInTheDocument();
    });
  });

  describe('Multiple Parameters', () => {
    it('should render multiple parameters correctly', () => {
      const params = [
        { operation: 'add' as const, name: 'param1', value: 'value1' },
        { operation: 'modify' as const, name: 'param2', value: 'value2' },
        { operation: 'remove' as const, name: 'param3' },
      ];

      render(<QueryParamEditor params={params} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('param1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('param2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('param3')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /remove parameter/i })).toHaveLength(3);
    });
  });
});
