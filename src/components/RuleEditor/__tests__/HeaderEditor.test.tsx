/**
 * HeaderEditor component tests
 * Tests actual user interactions and behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderEditor } from '../HeaderEditor';
import { HeaderOperation } from '@shared/types';

describe('HeaderEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show empty state message when no headers exist', () => {
      render(<HeaderEditor headers={[]} onChange={mockOnChange} />);

      expect(screen.getByText(/no headers configured/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add header/i })).toBeInTheDocument();
    });

    it('should not show empty state when headers exist', () => {
      render(
        <HeaderEditor
          headers={[{ operation: HeaderOperation.ADD, name: 'Test', value: 'Value' }]}
          onChange={mockOnChange}
        />
      );

      expect(screen.queryByText(/no headers configured/i)).not.toBeInTheDocument();
    });
  });

  describe('Adding Headers', () => {
    it('should add a new header when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<HeaderEditor headers={[]} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: /add header/i });
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          operation: HeaderOperation.ADD,
          name: '',
          value: '',
        },
      ]);
    });

    it('should append to existing headers when adding', async () => {
      const user = userEvent.setup();
      const existingHeaders = [
        { operation: HeaderOperation.ADD, name: 'Existing', value: 'Value' },
      ];

      render(<HeaderEditor headers={existingHeaders} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: /add header/i });
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        ...existingHeaders,
        {
          operation: HeaderOperation.ADD,
          name: '',
          value: '',
        },
      ]);
    });
  });

  describe('Removing Headers', () => {
    it('should remove a header when remove button is clicked', async () => {
      const user = userEvent.setup();
      const headers = [
        { operation: HeaderOperation.ADD, name: 'Header1', value: 'Value1' },
        { operation: HeaderOperation.ADD, name: 'Header2', value: 'Value2' },
      ];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove header/i });
      await user.click(removeButtons[0]!);

      expect(mockOnChange).toHaveBeenCalledWith([headers[1]]);
    });

    it('should remove the correct header by index', async () => {
      const user = userEvent.setup();
      const headers = [
        { operation: HeaderOperation.ADD, name: 'Header1', value: 'Value1' },
        { operation: HeaderOperation.ADD, name: 'Header2', value: 'Value2' },
        { operation: HeaderOperation.ADD, name: 'Header3', value: 'Value3' },
      ];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove header/i });
      await user.click(removeButtons[1]!); // Remove middle item

      expect(mockOnChange).toHaveBeenCalledWith([headers[0], headers[2]]);
    });
  });

  describe('Updating Header Operation', () => {
    it('should update operation type when select changes', async () => {
      const user = userEvent.setup();
      const headers = [{ operation: HeaderOperation.ADD, name: 'Test', value: 'Value' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const operationSelect = screen.getByDisplayValue('Add');
      await user.selectOptions(operationSelect, HeaderOperation.MODIFY);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          operation: HeaderOperation.MODIFY,
          name: 'Test',
          value: 'Value',
        },
      ]);
    });

    it('should update to REMOVE operation', async () => {
      const user = userEvent.setup();
      const headers = [{ operation: HeaderOperation.ADD, name: 'Test', value: 'Value' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const operationSelect = screen.getByDisplayValue('Add');
      await user.selectOptions(operationSelect, HeaderOperation.REMOVE);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          operation: HeaderOperation.REMOVE,
          name: 'Test',
          value: 'Value',
        },
      ]);
    });
  });

  describe('Updating Header Name', () => {
    it('should call onChange when header name input changes', async () => {
      const user = userEvent.setup();
      const headers = [{ operation: HeaderOperation.ADD, name: '', value: '' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const nameInput = screen.getByPlaceholderText(/e\.g\., Authorization/i);
      await user.type(nameInput, 'X');

      // Verify onChange was called with proper structure
      expect(mockOnChange).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstCall = mockOnChange.mock.calls[0] as any;
      expect(firstCall[0]).toBeInstanceOf(Array);
      expect(firstCall[0][0]).toHaveProperty('operation');
      expect(firstCall[0][0]).toHaveProperty('name');
      expect(firstCall[0][0]).toHaveProperty('value');
    });

    it('should preserve other header properties when updating name', async () => {
      const user = userEvent.setup();
      const headers = [
        { operation: HeaderOperation.MODIFY, name: 'Test', value: 'Value' },
      ];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const nameInput = screen.getByDisplayValue('Test');
      await user.type(nameInput, 'X');

      // Verify onChange preserves operation and value
      expect(mockOnChange).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstCall = mockOnChange.mock.calls[0] as any;
      expect(firstCall[0][0].operation).toBe(HeaderOperation.MODIFY);
      expect(firstCall[0][0].value).toBe('Value');
    });
  });

  describe('Updating Header Value', () => {
    it('should call onChange when header value input changes', async () => {
      const user = userEvent.setup();
      const headers = [{ operation: HeaderOperation.ADD, name: 'Auth', value: '' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const valueInput = screen.getByPlaceholderText(/e\.g\., Bearer token123/i);
      await user.type(valueInput, 'X');

      // Verify onChange was called with proper structure
      expect(mockOnChange).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstCall = mockOnChange.mock.calls[0] as any;
      expect(firstCall[0]).toBeInstanceOf(Array);
      expect(firstCall[0][0]).toHaveProperty('operation');
      expect(firstCall[0][0]).toHaveProperty('name');
      expect(firstCall[0][0]).toHaveProperty('value');
    });

    it('should preserve other header properties when updating value', async () => {
      const user = userEvent.setup();
      const headers = [
        { operation: HeaderOperation.MODIFY, name: 'Content-Type', value: 'Test' },
      ];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const valueInput = screen.getByDisplayValue('Test');
      await user.type(valueInput, 'X');

      // Verify onChange preserves operation and name
      expect(mockOnChange).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstCall = mockOnChange.mock.calls[0] as any;
      expect(firstCall[0][0].operation).toBe(HeaderOperation.MODIFY);
      expect(firstCall[0][0].name).toBe('Content-Type');
    });
  });

  describe('Conditional Rendering', () => {
    it('should show value input for ADD operation', () => {
      const headers = [{ operation: HeaderOperation.ADD, name: 'Test', value: 'Value' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText(/e\.g\., Bearer token123/i)).toBeInTheDocument();
    });

    it('should show value input for MODIFY operation', () => {
      const headers = [{ operation: HeaderOperation.MODIFY, name: 'Test', value: 'Value' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText(/e\.g\., Bearer token123/i)).toBeInTheDocument();
    });

    it('should NOT show value input for REMOVE operation', () => {
      const headers = [{ operation: HeaderOperation.REMOVE, name: 'Test' }];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      expect(screen.queryByPlaceholderText(/e\.g\., Bearer token123/i)).not.toBeInTheDocument();
    });
  });

  describe('Multiple Headers', () => {
    it('should render multiple headers correctly', () => {
      const headers = [
        { operation: HeaderOperation.ADD, name: 'Header1', value: 'Value1' },
        { operation: HeaderOperation.MODIFY, name: 'Header2', value: 'Value2' },
        { operation: HeaderOperation.REMOVE, name: 'Header3' },
      ];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('Header1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Header2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Header3')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /remove header/i })).toHaveLength(3);
    });

    it('should update only the targeted header in a list', async () => {
      const user = userEvent.setup();
      const headers = [
        { operation: HeaderOperation.ADD, name: 'Header1', value: 'Value1' },
        { operation: HeaderOperation.ADD, name: 'Header2', value: 'Value2' },
      ];

      render(<HeaderEditor headers={headers} onChange={mockOnChange} />);

      const nameInputs = screen.getAllByPlaceholderText(/e\.g\., Authorization/i);
      await user.type(nameInputs[1]!, 'X');

      expect(mockOnChange).toHaveBeenLastCalledWith([
        headers[0],
        { operation: HeaderOperation.ADD, name: 'Header2X', value: 'Value2' },
      ]);
    });
  });
});
