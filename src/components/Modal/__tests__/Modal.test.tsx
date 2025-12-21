import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });
  });

  it('should not render modal when closed', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not show close button when showCloseButton is false', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" showCloseButton={false}>
        <div>Modal Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  it('should render without title', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });
  });

  it('should apply testId when provided', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} testId="test-modal">
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-modal')).toBeInTheDocument();
    });
  });

  it('should apply testId to close button when testId is provided', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} testId="test-modal">
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByTestId('test-modal-close')).toBeInTheDocument();
    });
  });

  it('should not apply testId to close button when testId is not provided', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).not.toHaveAttribute('data-testid');
    });
  });

  it('should render with both title and close button by default', async () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });
});
