/**
 * ScriptInjectionEditor component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScriptInjectionEditor } from '../ScriptInjectionEditor';

describe('ScriptInjectionEditor', () => {
  const mockOnChange = vi.fn();

  const defaultScript = {
    code: '',
    runAt: 'document_end' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render injection timing select', () => {
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      expect(screen.getByText(/injection timing/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render code textarea', () => {
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Code')).toBeInTheDocument();
    });

    it('should render security warning', () => {
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      expect(screen.getByText(/security warning/i)).toBeInTheDocument();
    });
  });

  describe('Timing Selection', () => {
    it('should display current runAt value', () => {
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      const select = screen.getByDisplayValue(/document end/i);
      expect(select).toBeInTheDocument();
    });

    it('should call onChange when timing changes to document_start', async () => {
      const user = userEvent.setup();
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'document_start');

      expect(mockOnChange).toHaveBeenCalledWith({
        code: '',
        runAt: 'document_start',
      });
    });

    it('should call onChange when timing changes to document_idle', async () => {
      const user = userEvent.setup();
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'document_idle');

      expect(mockOnChange).toHaveBeenCalledWith({
        code: '',
        runAt: 'document_idle',
      });
    });

    it('should preserve code when changing timing', async () => {
      const user = userEvent.setup();
      const script = {
        code: 'console.log("test");',
        runAt: 'document_end' as const,
      };

      render(<ScriptInjectionEditor script={script} onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'document_start');

      expect(mockOnChange).toHaveBeenCalledWith({
        code: 'console.log("test");',
        runAt: 'document_start',
      });
    });
  });

  describe('Code Input', () => {
    it('should display current code value', () => {
      const script = {
        code: 'alert("Hello");',
        runAt: 'document_end' as const,
      };

      render(<ScriptInjectionEditor script={script} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('alert("Hello");')).toBeInTheDocument();
    });

    it('should call onChange when code changes', async () => {
      const user = userEvent.setup();
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.paste('console.log("test");');

      expect(mockOnChange).toHaveBeenCalledWith({
        code: 'console.log("test");',
        runAt: 'document_end',
      });
    });

    it('should preserve runAt when changing code', async () => {
      const user = userEvent.setup();
      const script = {
        code: '',
        runAt: 'document_start' as const,
      };

      render(<ScriptInjectionEditor script={script} onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'X');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall?.[0].runAt).toBe('document_start');
    });
  });

  describe('Placeholder', () => {
    it('should show placeholder text in code textarea', () => {
      render(<ScriptInjectionEditor script={defaultScript} onChange={mockOnChange} />);

      const textarea = screen.getByPlaceholderText(/enter javascript code/i);
      expect(textarea).toBeInTheDocument();
    });
  });
});
