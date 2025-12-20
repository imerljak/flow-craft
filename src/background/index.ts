/**
 * Background service worker for FlowCraft
 * Handles request interception and rule application
 */

import { Storage } from '@storage/index';

// Initialize storage on extension install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('FlowCraft installed');
  await Storage.initialize();
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
