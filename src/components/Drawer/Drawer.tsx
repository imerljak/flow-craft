/**
 * Drawer Component
 * A slide-in panel from the right side, better suited for complex forms than modals
 */

import { Fragment, JSX, ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import clsx from 'clsx';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  testId?: string;
}

export const Drawer = ({ isOpen, onClose, title, children, testId }: DrawerProps): JSX.Element => {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 pointer-events-none" />
        </TransitionChild>

        {/* Drawer Panel */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel
                  data-testid={testId}
                  className={clsx(
                    'pointer-events-auto w-screen max-w-2xl',
                    'flex flex-col h-full',
                    'bg-white dark:bg-neutral-900',
                    'shadow-xl'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                    <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {title}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={onClose}
                      data-testid={testId ? `${testId}-close` : undefined}
                      className="rounded-md text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Close drawer"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    {children}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
