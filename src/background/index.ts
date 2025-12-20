/**
 * Background service worker for FlowCraft
 * Handles request interception and rule application
 */

import { Storage } from '@storage/index';
import { RequestInterceptor } from './requestInterceptor';
import browser from 'webextension-polyfill';
import { Rule } from '@shared/types';

/**
 * Message types for runtime communication
 */
interface BackgroundMessage {
  type: 'GET_RULES' | 'SAVE_RULE' | 'DELETE_RULE' | 'SYNC_RULES';
  data?: Rule | string;
}

/**
 * Initialize extension and sync rules
 */
async function initializeExtension(): Promise<void> {
  await Storage.initialize();
  await syncRules();
}

/**
 * Sync rules from storage to Chrome's declarativeNetRequest
 */
async function syncRules(): Promise<void> {
  try {
    const rules = await Storage.getRules();
    await RequestInterceptor.updateDynamicRules(rules);
  } catch (error) {
    console.error('Failed to sync rules:', error);
  }
}

// Initialize on install or update
browser.runtime.onInstalled.addListener(async (): Promise<void> => {
  await initializeExtension();
});

// Initialize on startup
browser.runtime.onStartup.addListener(async (): Promise<void> => {
  await syncRules();
});

// Listen for storage changes and sync rules
browser.storage.onChanged.addListener((changes, areaName): void => {
  if (areaName === 'local' && changes.rules) {
    void syncRules();
  }
});


// Handle messages from popup/options pages
browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse): true => {
  // Type guard for BackgroundMessage
  const msg = message as BackgroundMessage;

  // Handle async operations
  void (async (): Promise<void> => {
    try {
      switch (msg.type) {
        case 'GET_RULES': {
          const rules = await Storage.getRules();
          sendResponse({ success: true, data: rules });
          break;
        }
        case 'SAVE_RULE': {
          await Storage.saveRule(msg.data as Rule);
          // Rules will be synced automatically via storage change listener
          sendResponse({ success: true });
          break;
        }
        case 'DELETE_RULE': {
          await Storage.deleteRule(msg.data as string);
          sendResponse({ success: true });
          break;
        }
        case 'SYNC_RULES': {
          await syncRules();
          sendResponse({ success: true });
          break;
        }
        default: {
          sendResponse({ success: false, error: 'Unknown message type' });
        }
      }
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  })();

  // Return true to indicate we'll send a response asynchronously
  return true;
});
