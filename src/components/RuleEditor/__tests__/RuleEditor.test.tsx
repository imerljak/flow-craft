/**
 * RuleEditor component tests - TDD approach
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuleEditor } from '../RuleEditor';
import { Rule, RuleType } from "@shared/types";

describe('RuleEditor', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty form for new rule', () => {
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/rule name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url pattern/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pattern type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rule type/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render existing rule in edit mode', () => {
      const existingRule: Rule = {
        id: 'test-1',
        name: 'Test Rule',
        description: 'Test Description',
        enabled: true,
        priority: 10,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com',
        },
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      render(<RuleEditor rule={existingRule} onSave={mockOnSave} onCancel={mockOnCancel} />);

      expect(screen.getByDisplayValue('Test Rule')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should require rule name', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(await screen.findByText(/rule name is required/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should require URL pattern', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/rule name/i);
      await user.type(nameInput, 'Test Rule');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(await screen.findByText(/url pattern is required/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate URL format for exact pattern type', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/rule name/i);
      await user.type(nameInput, 'Test Rule');

      const patternInput = screen.getByLabelText(/url pattern/i);
      await user.type(patternInput, 'invalid-url');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(await screen.findByText(/invalid url format/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should validate regex pattern', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/rule name/i);
      await user.type(nameInput, 'Test Rule');

      const typeSelect = screen.getByLabelText(/pattern type/i);
      await user.selectOptions(typeSelect, 'regex');

      const patternInput = screen.getByLabelText(/url pattern/i);
      await user.type(patternInput, '[invalid(regex');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(await screen.findByText(/invalid regex pattern/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Form Interaction', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should create a basic header modification rule', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Fill in required fields
      await user.type(screen.getByLabelText(/rule name/i), 'Add Custom Header');
      await user.type(screen.getByLabelText(/url pattern/i), 'https://api.example.com/*');

      // Select wildcard pattern type
      await user.selectOptions(screen.getByLabelText(/pattern type/i), 'wildcard');

      // Select header modification type
      await user.selectOptions(screen.getByLabelText(/rule type/i), 'header_modification');

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const savedRule = mockOnSave.mock.calls[0]?.[0] as Rule;
      expect(savedRule.name).toBe('Add Custom Header');
      expect(savedRule.matcher.pattern).toBe('https://api.example.com/*');
      expect(savedRule.matcher.type).toBe('wildcard');
      expect(savedRule.action.type).toBe(RuleType.HEADER_MODIFICATION);
    });

    it('should create a URL redirect rule', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/rule name/i), 'Redirect to New URL');
      await user.type(screen.getByLabelText(/url pattern/i), 'https://old.example.com');
      await user.selectOptions(screen.getByLabelText(/rule type/i), 'url_redirect');

      // Should show redirect URL field
      const redirectInput = await screen.findByLabelText(/redirect url/i);
      await user.type(redirectInput, 'https://new.example.com');

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const savedRule = mockOnSave.mock.calls[0]?.[0] as Rule;
      expect(savedRule.action.type).toBe(RuleType.URL_REDIRECT);
      if (savedRule.action.type === RuleType.URL_REDIRECT) {
        expect(savedRule.action.redirectUrl).toBe('https://new.example.com');
      }
    });

    it('should update existing rule', async () => {
      const user = userEvent.setup();
      const existingRule: Rule = {
        id: 'test-1',
        name: 'Old Name',
        enabled: true,
        priority: 10,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com',
        },
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      render(<RuleEditor rule={existingRule} onSave={mockOnSave} onCancel={mockOnCancel} />);

      const nameInput = screen.getByDisplayValue('Old Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const savedRule = mockOnSave.mock.calls[0]?.[0] as Rule;
      expect(savedRule.id).toBe('test-1');
      expect(savedRule.name).toBe('New Name');
    });
  });

  describe('Header Editor Integration', () => {
    it('should show header editor for header modification type', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      await user.selectOptions(screen.getByLabelText(/rule type/i), 'header_modification');

      expect(screen.getByText(/headers/i)).toBeInTheDocument();
    });
  });

  describe('Priority and Advanced Settings', () => {
    it('should set default priority', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/rule name/i), 'Test Rule');
      await user.type(screen.getByLabelText(/url pattern/i), 'https://example.com');

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const savedRule = mockOnSave.mock.calls[0]?.[0] as Rule;
      expect(savedRule.priority).toBeDefined();
      expect(savedRule.priority).toBeGreaterThan(0);
    });

    it('should allow custom priority', async () => {
      const user = userEvent.setup();
      render(<RuleEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      await user.type(screen.getByLabelText(/rule name/i), 'Test Rule');
      await user.type(screen.getByLabelText(/url pattern/i), 'https://example.com');

      const priorityInput = screen.getByLabelText(/priority/i);
      await user.clear(priorityInput);
      await user.type(priorityInput, '5');

      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const savedRule = mockOnSave.mock.calls[0]?.[0] as Rule;
      expect(savedRule.priority).toBe(5);
    });
  });
});
