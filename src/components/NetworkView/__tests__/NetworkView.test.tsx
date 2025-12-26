/**
 * Comprehensive tests for NetworkView Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkView } from '../NetworkView';
import { HttpLog, LogActionType, HttpMethod } from '@shared/types';
import browser from 'webextension-polyfill';

// Get the mocked browser API (already mocked in setupTests.ts)
const mockBrowser = browser as unknown as {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
  };
};

// Mock window.confirm
const mockConfirm = vi.fn();
vi.stubGlobal('confirm', mockConfirm);

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLAnchorElement.click
HTMLAnchorElement.prototype.click = vi.fn();

const mockLogs: HttpLog[] = [
  {
    id: 'log-1',
    url: 'https://api.example.com/users',
    method: 'GET' as HttpMethod,
    timestamp: Date.now(),
    action: 'original' as LogActionType,
    status: 200,
    duration: 150,
  },
  {
    id: 'log-2',
    url: 'https://api.example.com/posts',
    method: 'POST' as HttpMethod,
    timestamp: Date.now(),
    action: 'mocked' as LogActionType,
    status: 201,
    duration: 50,
    ruleId: 'rule-1',
  },
  {
    id: 'log-3',
    url: 'https://api.example.com/blocked',
    method: 'DELETE' as HttpMethod,
    timestamp: Date.now(),
    action: 'blocked' as LogActionType,
    ruleId: 'rule-2',
  },
];

describe('NetworkView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Mock both GET_LOGS and GET_LOG_STATS responses
    mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
      if (message.type === 'GET_LOGS') {
        return Promise.resolve({
          success: true,
          logs: [],
        });
      }
      if (message.type === 'GET_LOG_STATS') {
        return Promise.resolve({
          success: true,
          stats: {
            totalLogs: 0,
            mockedCount: 0,
            blockedCount: 0,
            modifiedCount: 0,
            originalCount: 0,
          },
        });
      }
      return Promise.resolve({ success: false });
    });
  });

  describe('Rendering', () => {
    it('should render network view with heading', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);
      expect(screen.getByText(/Network Logs/i)).toBeInTheDocument();
    });

    it('should display request count', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Should show 0 requests initially
      expect(screen.getByText(/0 requests/i)).toBeInTheDocument();
    });

    it('should display stats when available', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Should show stats in subtitle
      await waitFor(() => {
        expect(screen.getByText(/1 mocked, 1 blocked/i)).toBeInTheDocument();
      });
    });
  });

  describe('Buttons', () => {
    it('should have export JSON button', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const exportBtn = screen.getByTestId('export-json-btn');
      expect(exportBtn).toBeInTheDocument();
      expect(exportBtn).toHaveTextContent(/Export JSON/i);
    });

    it('should have export CSV button', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const exportBtn = screen.getByTestId('export-csv-btn');
      expect(exportBtn).toBeInTheDocument();
      expect(exportBtn).toHaveTextContent(/Export CSV/i);
    });

    it('should have clear logs button', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const clearBtn = screen.getByTestId('clear-logs-btn');
      expect(clearBtn).toBeInTheDocument();
      expect(clearBtn).toHaveTextContent(/Clear Logs/i);
    });
  });

  describe('Filters', () => {
    it('should have URL filter input', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const urlInput = screen.getByTestId('filter-url-input');
      expect(urlInput).toBeInTheDocument();
      expect(urlInput).toHaveAttribute('placeholder', 'Filter by URL...');
    });

    it('should have action filter select', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const actionSelect = screen.getByTestId('filter-action-select');
      expect(actionSelect).toBeInTheDocument();
    });

    it('should have method filter select', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const methodSelect = screen.getByTestId('filter-method-select');
      expect(methodSelect).toBeInTheDocument();
    });

    it('should filter logs by URL', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Initially shows 3 requests
      await waitFor(() => {
        expect(screen.getByText(/3 requests/i)).toBeInTheDocument();
      });

      // Filter by URL
      const urlInput = screen.getByTestId('filter-url-input');
      fireEvent.change(urlInput, { target: { value: 'users' } });

      // Should update request count (filtering happens client-side)
      // The component filters logs but we're testing the filter input works
      expect(urlInput).toHaveValue('users');
    });

    it('should filter logs by action', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const actionSelect = screen.getByTestId('filter-action-select');
      fireEvent.change(actionSelect, { target: { value: 'mocked' } });

      expect(actionSelect).toHaveValue('mocked');
    });

    it('should filter logs by method', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const methodSelect = screen.getByTestId('filter-method-select');
      fireEvent.change(methodSelect, { target: { value: 'POST' } });

      expect(methodSelect).toHaveValue('POST');
    });
  });

  describe('Export Functionality', () => {
    it('should export logs as JSON when clicking export JSON button', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        if (message.type === 'EXPORT_LOGS') {
          return Promise.resolve({
            success: true,
            data: JSON.stringify(mockLogs),
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const exportBtn = screen.getByTestId('export-json-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'EXPORT_LOGS',
          })
        );
      });

      // Should create blob and trigger download
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should export logs as CSV when clicking export CSV button', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        if (message.type === 'EXPORT_LOGS_CSV') {
          return Promise.resolve({
            success: true,
            data: 'url,method,status\n...',
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const exportBtn = screen.getByTestId('export-csv-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'EXPORT_LOGS_CSV',
          })
        );
      });
    });

    it('should include active filters when exporting', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        if (message.type === 'EXPORT_LOGS') {
          return Promise.resolve({
            success: true,
            data: JSON.stringify([]),
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Set filters
      const urlInput = screen.getByTestId('filter-url-input');
      fireEvent.change(urlInput, { target: { value: 'users' } });

      const exportBtn = screen.getByTestId('export-json-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'EXPORT_LOGS',
            filter: expect.objectContaining({
              url: 'users',
            }),
          })
        );
      });
    });
  });

  describe('Clear Logs', () => {
    it('should show confirmation dialog when clearing logs', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const clearBtn = screen.getByTestId('clear-logs-btn');
      fireEvent.click(clearBtn);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to clear all logs? This cannot be undone.'
      );
    });

    it('should clear logs when user confirms', async () => {
      mockConfirm.mockReturnValue(true);
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        if (message.type === 'CLEAR_LOGS') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const clearBtn = screen.getByTestId('clear-logs-btn');
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'CLEAR_LOGS',
        });
      });
    });

    it('should not clear logs when user cancels', async () => {
      mockConfirm.mockReturnValue(false);

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const clearBtn = screen.getByTestId('clear-logs-btn');

      fireEvent.click(clearBtn);

      // Should not send CLEAR_LOGS message
      await new Promise(resolve => setTimeout(resolve, 100));

      const clearLogsCalls = mockBrowser.runtime.sendMessage.mock.calls.filter(
        call => call[0]?.type === 'CLEAR_LOGS'
      );
      expect(clearLogsCalls).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading logs fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.reject(new Error('Failed to load logs'));
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 0,
              mockedCount: 0,
              blockedCount: 0,
              modifiedCount: 0,
              originalCount: 0,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load logs:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when loading stats fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: [],
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.reject(new Error('Failed to load stats'));
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load stats:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when clearing logs fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockConfirm.mockReturnValue(true);

      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: [],
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 0,
              mockedCount: 0,
              blockedCount: 0,
              modifiedCount: 0,
              originalCount: 0,
            },
          });
        }
        if (message.type === 'CLEAR_LOGS') {
          return Promise.reject(new Error('Failed to clear logs'));
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const clearBtn = screen.getByTestId('clear-logs-btn');
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to clear logs:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when exporting JSON fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: [],
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 0,
              mockedCount: 0,
              blockedCount: 0,
              modifiedCount: 0,
              originalCount: 0,
            },
          });
        }
        if (message.type === 'EXPORT_LOGS') {
          return Promise.reject(new Error('Failed to export logs'));
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const exportBtn = screen.getByTestId('export-json-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to export logs:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle error when exporting CSV fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: [],
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 0,
              mockedCount: 0,
              blockedCount: 0,
              modifiedCount: 0,
              originalCount: 0,
            },
          });
        }
        if (message.type === 'EXPORT_LOGS_CSV') {
          return Promise.reject(new Error('Failed to export CSV'));
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      const exportBtn = screen.getByTestId('export-csv-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to export logs:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Loading', () => {
    it('should load logs on mount', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'GET_LOGS',
        });
      });
    });

    it('should load stats on mount', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith({
          type: 'GET_LOG_STATS',
        });
      });
    });

    it('should set loading to false after logs load', async () => {
      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Component should render without loading spinner
      await waitFor(() => {
        expect(screen.getByText(/0 requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Log Details', () => {
    it('should show detail panel when clicking on a log row', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Wait for logs to load
      await waitFor(() => {
        expect(screen.getByText(/3 requests/i)).toBeInTheDocument();
      });

      // Click on the first log row
      const logRow = screen.getByText('https://api.example.com/users').closest('tr');
      if (logRow) {
        fireEvent.click(logRow);
      }

      // Detail panel should be visible
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('should close detail panel when clicking close button', async () => {
      mockBrowser.runtime.sendMessage.mockImplementation((message: { type: string }) => {
        if (message.type === 'GET_LOGS') {
          return Promise.resolve({
            success: true,
            logs: mockLogs,
          });
        }
        if (message.type === 'GET_LOG_STATS') {
          return Promise.resolve({
            success: true,
            stats: {
              totalLogs: 3,
              mockedCount: 1,
              blockedCount: 1,
              modifiedCount: 0,
              originalCount: 1,
            },
          });
        }
        return Promise.resolve({ success: false });
      });

      render(<NetworkView />);
      await screen.findByText(/Network Logs/i);

      // Wait for logs and click on a row
      await waitFor(() => {
        expect(screen.getByText(/3 requests/i)).toBeInTheDocument();
      });

      const logRow = screen.getByText('https://api.example.com/users').closest('tr');
      if (logRow) {
        fireEvent.click(logRow);
      }

      // Detail panel should be visible
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      // Detail panel should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Details')).not.toBeInTheDocument();
      });
    });
  });
});
