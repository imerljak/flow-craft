import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

/**
 * Input component with label, error, and helper text support
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    const inputStyles = clsx(
      'block px-3 py-2 border rounded-md text-sm transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
      'disabled:bg-neutral-100 disabled:cursor-not-allowed',
      'dark:bg-neutral-800 dark:border-neutral-700 dark:text-white',
      {
        'border-error-500 focus:ring-error-500 focus:border-error-500': error,
        'border-neutral-300 dark:border-neutral-600': !error,
        'w-full': fullWidth,
      },
      className
    );

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={inputStyles} {...props} />
        {error && <p className="text-xs text-error-500">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
