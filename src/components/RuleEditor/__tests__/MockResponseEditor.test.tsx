/**
 * MockResponseEditor component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockResponseEditor } from '../MockResponseEditor';

describe('MockResponseEditor', () => {
  const mockOnChange = vi.fn();

  const defaultMockResponse = {
    statusCode: 200,
    headers: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render status code input', () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      expect(screen.getByText('Status Code')).toBeInTheDocument();
      expect(screen.getByTestId('status-code-input')).toBeInTheDocument();
    });

    it('should render status text input', () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      expect(screen.getByText(/status text/i)).toBeInTheDocument();
    });

    it('should render response body textarea', () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText(/{"message": "This is a mock response"/)).toBeInTheDocument();
    });

    it('should render delay input', () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      expect(screen.getByText(/response delay/i)).toBeInTheDocument();
    });

    it('should render info note', () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      expect(screen.getByText(/note:/i)).toBeInTheDocument();
    });
  });

  describe('Status Code', () => {
    it('should display current status code', () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      expect(screen.getByTestId('status-code-input')).toBeInTheDocument();
    });

    it('should call onChange when status code changes', async () => {
      const user = userEvent.setup();
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const input = screen.getByTestId('status-code-input');
      await user.tripleClick(input);
      await user.paste('404');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall?.[0].statusCode).toBe(404);
    });
  });

  describe('Status Text', () => {
    it('should display current status text', () => {
      const mockResponse = {
        ...defaultMockResponse,
        statusText: 'Not Found',
      };

      render(<MockResponseEditor mockResponse={mockResponse} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('Not Found')).toBeInTheDocument();
    });

    it('should call onChange when status text changes', async () => {
      const user = userEvent.setup();
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const input = screen.getByTestId('status-text-input');
      await user.click(input);
      await user.paste('Custom Status');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall?.[0].statusText).toBe('Custom Status');
    });
  });

  describe('Response Body', () => {
    it('should display current body', () => {
      const mockResponse = {
        ...defaultMockResponse,
        body: '{"message": "test"}',
      };

      render(<MockResponseEditor mockResponse={mockResponse} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('{"message": "test"}')).toBeInTheDocument();
    });

    it('should call onChange when body changes', async () => {
      const user = userEvent.setup();
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const textarea = screen.getByTestId('response-body-textarea');
      await user.click(textarea);
      await user.paste('test body');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall?.[0].body).toBe('test body');
    });
  });

  describe('Delay', () => {
    it('should display current delay', () => {
      const mockResponse = {
        ...defaultMockResponse,
        delay: 1000,
      };

      render(<MockResponseEditor mockResponse={mockResponse} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    it('should call onChange when delay changes', async () => {
      const user = userEvent.setup();
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const input = screen.getByTestId('response-delay-input');
      await user.click(input);
      await user.paste('500');

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall?.[0].delay).toBe(500);
    });
  });

  describe('Response Headers', () => {
    it('should display existing headers', () => {
      const mockResponse = {
        ...defaultMockResponse,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        },
      };

      render(<MockResponseEditor mockResponse={mockResponse} onChange={mockOnChange} />);

      expect(screen.getByText(/Content-Type: application\/json/i)).toBeInTheDocument();
      expect(screen.getByText(/X-Custom: value/i)).toBeInTheDocument();
    });

    it('should add new header when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const nameInput = screen.getByTestId('header-name-input');
      const valueInput = screen.getByTestId('header-value-input');
      const addButton = screen.getByTestId('add-header-btn');

      await user.type(nameInput, 'X-Test');
      await user.type(valueInput, 'test-value');
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultMockResponse,
        headers: {
          'X-Test': 'test-value',
        },
      });
    });

    it('should not add header if name is empty', async () => {
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const addButton = screen.getByTestId('add-header-btn');
      expect(addButton).toBeDisabled();
    });

    it('should remove header when remove button is clicked', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        ...defaultMockResponse,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      render(<MockResponseEditor mockResponse={mockResponse} onChange={mockOnChange} />);

      const removeButton = screen.getByRole('button', { name: /remove content-type header/i });
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultMockResponse,
        headers: {},
      });
    });

    it('should clear input fields after adding header', async () => {
      const user = userEvent.setup();
      render(<MockResponseEditor mockResponse={defaultMockResponse} onChange={mockOnChange} />);

      const nameInput = screen.getByTestId('header-name-input');
      const valueInput = screen.getByTestId('header-value-input');
      const addButton = screen.getByTestId('add-header-btn');

      await user.type(nameInput, 'X-Test');
      await user.type(valueInput, 'test-value');
      await user.click(addButton);

      // Input fields should be cleared
      expect(screen.getByTestId('header-name-input')).toHaveValue('');
      expect(screen.getByTestId('header-value-input')).toHaveValue('');
    });
  });
});
