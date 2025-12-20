import React from 'react';
import clsx from 'clsx';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  testId?: string;
}

/**
 * Modal/Dialog component using Headless UI
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  testId,
}) => {
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <DialogPanel
          data-testid={testId}
          className={clsx(
            'relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full pointer-events-auto',
            sizeStyles[size]
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              {title && (
                <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {title}
                </DialogTitle>
              )}
              {showCloseButton && (
                <button
                  data-testid={testId ? `${testId}-close` : undefined}
                  onClick={onClose}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
