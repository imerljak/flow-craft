import React from 'react';
import clsx from 'clsx';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Toggle/Switch component
 */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: {
      container: 'w-8 h-5',
      thumb: 'w-3 h-3',
      translate: checked ? 'translate-x-3.5' : 'translate-x-0.5',
    },
    md: {
      container: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0.5',
    },
    lg: {
      container: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: checked ? 'translate-x-7' : 'translate-x-0.5',
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        currentSize.container,
        {
          'bg-primary-500': checked && !disabled,
          'bg-neutral-300 dark:bg-neutral-600': !checked && !disabled,
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {label && <span className="sr-only">{label}</span>}
      <span
        className={clsx(
          'inline-block bg-white rounded-full shadow-sm transform transition-transform',
          currentSize.thumb,
          currentSize.translate
        )}
      />
    </button>
  );
};
