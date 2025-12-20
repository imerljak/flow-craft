import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toggle in unchecked state', () => {
    render(<Toggle checked={false} onChange={mockOnChange} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('should render toggle in checked state', () => {
    render(<Toggle checked={true} onChange={mockOnChange} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('should call onChange with true when clicked in unchecked state', async () => {
    const user = userEvent.setup();
    render(<Toggle checked={false} onChange={mockOnChange} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange with false when clicked in checked state', async () => {
    const user = userEvent.setup();
    render(<Toggle checked={true} onChange={mockOnChange} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it('should not call onChange when disabled', async () => {
    const user = userEvent.setup();
    render(<Toggle checked={false} onChange={mockOnChange} disabled={true} />);

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should render with label', () => {
    render(<Toggle checked={false} onChange={mockOnChange} label="Enable feature" />);

    // Label should be screen reader only
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('should apply small size styles', () => {
    const { container } = render(<Toggle checked={false} onChange={mockOnChange} size="sm" />);

    const toggle = container.querySelector('[class*="w-8"]');
    expect(toggle).toBeInTheDocument();
  });

  it('should apply medium size styles', () => {
    const { container } = render(<Toggle checked={false} onChange={mockOnChange} size="md" />);

    const toggle = container.querySelector('[class*="w-11"]');
    expect(toggle).toBeInTheDocument();
  });

  it('should apply large size styles', () => {
    const { container } = render(<Toggle checked={false} onChange={mockOnChange} size="lg" />);

    const toggle = container.querySelector('[class*="w-14"]');
    expect(toggle).toBeInTheDocument();
  });

  it('should apply disabled styles when disabled', () => {
    render(<Toggle checked={false} onChange={mockOnChange} disabled={true} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should apply checked background color when checked and not disabled', () => {
    render(<Toggle checked={true} onChange={mockOnChange} disabled={false} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('bg-primary-500');
  });

  it('should apply unchecked background color when not checked and not disabled', () => {
    render(<Toggle checked={false} onChange={mockOnChange} disabled={false} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass('bg-neutral-300', 'dark:bg-neutral-600');
  });

  it('should translate thumb to the right when checked (sm)', () => {
    const { container } = render(<Toggle checked={true} onChange={mockOnChange} size="sm" />);

    const thumb = container.querySelector('[class*="translate-x-3.5"]');
    expect(thumb).toBeInTheDocument();
  });

  it('should translate thumb to the left when unchecked (sm)', () => {
    const { container } = render(<Toggle checked={false} onChange={mockOnChange} size="sm" />);

    const thumb = container.querySelector('[class*="translate-x-0.5"]');
    expect(thumb).toBeInTheDocument();
  });

  it('should translate thumb to the right when checked (md)', () => {
    const { container } = render(<Toggle checked={true} onChange={mockOnChange} size="md" />);

    const thumb = container.querySelector('[class*="translate-x-5"]');
    expect(thumb).toBeInTheDocument();
  });

  it('should translate thumb to the right when checked (lg)', () => {
    const { container } = render(<Toggle checked={true} onChange={mockOnChange} size="lg" />);

    const thumb = container.querySelector('[class*="translate-x-7"]');
    expect(thumb).toBeInTheDocument();
  });
});
