/**
 * Background service worker for FlowCraft
 * Handles request interception and rule application
 */

import { Storage } from '@storage/index';
import { RequestInterceptor } from './requestInterceptor';

/**
 * Initialize extension and sync rules
 */
async function initializeExtension(): Promise<void> {
  console.log('FlowCraft initializing...');
  await Storage.initialize();
  await syncRules();
  console.log('FlowCraft initialized');
}

/**
 * Sync rules from storage to Chrome's declarativeNetRequest
 */
async function syncRules(): Promise<void> {
  try {
    const rules = await Storage.getRules();
    await RequestInterceptor.updateDynamicRules(rules);
    console.log(`Synced ${rules.length} rules to declarativeNetRequest`);
  } catch (error) {
    console.error('Failed to sync rules:', error);
  }
}

// Initialize on install or update
chrome.runtime.onInstalled.addListener(async () => {
  await initializeExtension();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await syncRules();
});

// Listen for storage changes and sync rules
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.rules) {
    console.log('Rules changed, syncing...');
    syncRules();
  }
});

// Handle messages from popup/options pages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Received message:', message);

  // Handle async operations
  (async () => {
    try {
      switch (message.type) {
        case 'GET_RULES':
          const rules = await Storage.getRules();
          sendResponse({ success: true, data: rules });
          break;
        case 'SAVE_RULE':
          await Storage.saveRule(message.data);
          // Rules will be synced automatically via storage change listener
          sendResponse({ success: true });
          break;
        case 'DELETE_RULE':
          await Storage.deleteRule(message.data);
          sendResponse({ success: true });
          break;
        case 'SYNC_RULES':
          await syncRules();
          sendResponse({ success: true });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  })();

  // Return true to indicate we'll send a response asynchronously
  return true;
});

console.log('FlowCraft background service worker loaded');
