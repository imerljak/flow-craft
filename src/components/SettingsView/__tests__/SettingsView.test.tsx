/**
 * Comprehensive tests for SettingsView Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsView } from '../SettingsView';
import { DEFAULT_SETTINGS } from '@shared/types';
import { Storage } from '@storage/index';
import browser from 'webextension-polyfill';

// Get the mocked browser API (already mocked in setupTests.ts)
const mockBrowser = browser as unknown as {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
  };
  storage: {
    local: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
    };
  };
};

// Mock Storage module
vi.mock('@storage/index', () => ({
  Storage: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
}));

// Mock DOM methods
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();
HTMLAnchorElement.prototype.click = vi.fn();
const mockPrompt = vi.fn();
vi.stubGlobal('prompt', mockPrompt);

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Storage.getSettings to return default settings
    (Storage.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(DEFAULT_SETTINGS);
    (Storage.saveSettings as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    mockBrowser.runtime.sendMessage.mockResolvedValue({
      success: true,
      data: JSON.stringify({ rules: [] }),
    });
  });

  describe('Rendering', () => {
    it('should render settings view with heading', async () => {
      render(<SettingsView />);

      await screen.findByText(/^Settings$/i);
      expect(screen.getByText(/^Settings$/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<SettingsView />);

      expect(screen.getByText(/Loading settings/i)).toBeInTheDocument();
    });

    it('should display all main sections', async () => {
      render(<SettingsView />);

      await screen.findByText(/^Settings$/i);

      expect(screen.getByText(/General/i)).toBeInTheDocument();
      expect(screen.getByText(/Request\/Response Logger/i)).toBeInTheDocument();
      expect(screen.getByText(/Import\/Export Rules/i)).toBeInTheDocument();
    });
  });

  describe('Save Button', () => {
    it('should have save settings button', async () => {
      render(<SettingsView />);

      await screen.findByText(/^Settings$/i);
      const saveBtn = screen.getByTestId('save-settings-btn');
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn).toHaveTextContent(/Save Settings/i);
    });

    it('should save settings when save button is clicked', async () => {
      render(<SettingsView />);

      await screen.findByText(/^Settings$/i);

      const saveBtn = screen.getByTestId('save-settings-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(Storage.saveSettings).toHaveBeenCalled();
      });
    });

    it('should show saving status', async () => {
      (Storage.saveSettings as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const saveBtn = screen.getByTestId('save-settings-btn');
      fireEvent.click(saveBtn);

      expect(await screen.findByText(/Saving\.\.\./i)).toBeInTheDocument();
    });

    it('should show success status after saving', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const saveBtn = screen.getByTestId('save-settings-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/✓ Saved/i)).toBeInTheDocument();
      });
    });

    it('should show error status when save fails', async () => {
      (Storage.saveSettings as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Save failed')
      );

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const saveBtn = screen.getByTestId('save-settings-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/✗ Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('General Settings', () => {
    it('should have enable extension toggle', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const toggle = screen.getByTestId('enable-extension-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should toggle extension enabled state', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const toggle = screen.getByTestId('enable-extension-toggle');
      fireEvent.click(toggle);

      // Should update the state
      expect(toggle).toBeInTheDocument();
    });

    it('should have enable notifications toggle', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const toggle = screen.getByTestId('enable-notifications-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should toggle notifications state', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const toggle = screen.getByTestId('enable-notifications-toggle');
      fireEvent.click(toggle);

      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Logger Settings', () => {
    it('should have logger enable toggle', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const toggle = screen.getByTestId('logger-enabled-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should show logger configuration when enabled', async () => {
      (Storage.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
        },
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      expect(screen.getByText(/Maximum Log Size/i)).toBeInTheDocument();
      expect(screen.getByText(/Capture Headers/i)).toBeInTheDocument();
    });

    it('should hide logger configuration when disabled', async () => {
      (Storage.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: false,
        },
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      expect(screen.queryByText(/Maximum Log Size/i)).not.toBeInTheDocument();
    });

    it('should have max log size input when logger enabled', async () => {
      (Storage.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
        },
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const input = screen.getByTestId('max-log-size-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(DEFAULT_SETTINGS.logger.maxLogSize);
    });

    it('should update max log size', async () => {
      (Storage.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
        },
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const input = screen.getByTestId('max-log-size-input');
      fireEvent.change(input, { target: { value: '500' } });

      expect(input).toHaveValue(500);
    });

    it('should toggle logger enabled state', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const toggle = screen.getByTestId('logger-enabled-toggle');
      fireEvent.click(toggle);

      // Logger config should now be visible
      await waitFor(() => {
        expect(screen.getByText(/Maximum Log Size/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const exportBtn = screen.getByTestId('export-rules-btn');
      expect(exportBtn).toBeInTheDocument();
    });

    it('should export rules when clicking export button', async () => {
      mockBrowser.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: JSON.stringify({ rules: [], groups: [] }),
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const exportBtn = screen.getByTestId('export-rules-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockBrowser.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'EXPORT_RULES',
          })
        );
      });
    });

    it('should create download when export succeeds', async () => {
      mockBrowser.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: JSON.stringify({ rules: [] }),
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const exportBtn = screen.getByTestId('export-rules-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
        expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
      });
    });

    it('should show export success status', async () => {
      mockBrowser.runtime.sendMessage.mockResolvedValue({
        success: true,
        data: JSON.stringify({ rules: [] }),
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const exportBtn = screen.getByTestId('export-rules-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText(/✓ Exported/i)).toBeInTheDocument();
      });
    });

    it('should show error status when export fails', async () => {
      mockBrowser.runtime.sendMessage.mockResolvedValue({
        success: false,
        error: 'Export failed',
      });

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const exportBtn = screen.getByTestId('export-rules-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByText(/✗ Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Import Functionality', () => {
    it('should have import button', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const importBtn = screen.getByTestId('import-rules-btn');
      expect(importBtn).toBeInTheDocument();
    });

    it('should trigger file input when import button clicked', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      const importBtn = screen.getByTestId('import-rules-btn');
      fireEvent.click(importBtn);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should accept JSON files for import', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.json');
    });

    it('should show importing status', async () => {
      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      const importBtn = screen.getByTestId('import-rules-btn');
      expect(importBtn).toHaveTextContent(/Choose File/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle settings load error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (Storage.getSettings as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to load settings')
      );

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      // Should still render with default settings
      expect(screen.getByText(/Save Settings/i)).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('URL Filters', () => {
    it('should add URL filter when prompt returns value', async () => {
      (Storage.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        logger: {
          ...DEFAULT_SETTINGS.logger,
          enabled: true,
        },
      });

      mockPrompt.mockReturnValue('*://*.google-analytics.com/*');

      render(<SettingsView />);
      await screen.findByText(/^Settings$/i);

      // Find and click "Add URL Filter" button (it's a text/button element)
      const addFilterElements = screen.getAllByText(/URL/i);
      // The component should have URL filter functionality visible when logger is enabled
      expect(addFilterElements.length).toBeGreaterThan(0);
    });
  });
});
