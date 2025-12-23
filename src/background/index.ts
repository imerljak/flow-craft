/**
 * Background service worker for FlowCraft
 * Handles request interception and rule application
 */

import { Storage } from '@storage/index';
import { RequestInterceptor } from './requestInterceptor';
import { ScriptInjector } from './scriptInjector';
import { ResponseMocker } from './responseMocker';
import browser from 'webextension-polyfill';
import { Rule } from '@shared/types';

/**
 * Message types for runtime communication
 */
interface BackgroundMessage {
  type: 'GET_RULES' | 'SAVE_RULE' | 'DELETE_RULE' | 'SYNC_RULES' | 'GET_MOCK_RULES' | 'FIND_MOCK_RULE' | 'INJECT_MAIN_WORLD';
  data?: Rule | string;
  url?: string;
  tabId?: number;
}

/**
 * Initialize extension and sync rules
 */
async function initializeExtension(): Promise<void> {
  await Storage.initialize();
  await syncRules();
}

/**
 * Sync rules from storage to Chrome's declarativeNetRequest, ScriptInjector, and ResponseMocker
 */
async function syncRules(): Promise<void> {
  try {
    const rules = await Storage.getRules();
    await RequestInterceptor.updateDynamicRules(rules);
    await ScriptInjector.updateScriptRules(rules);
    await ResponseMocker.updateMockRules(rules);

    // Notify all content scripts about rule updates
    await notifyContentScripts();
  } catch (error) {
    console.error('Failed to sync rules:', error);
  }
}

/**
 * Notify all content scripts to sync mock rules
 */
async function notifyContentScripts(): Promise<void> {
  try {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await browser.tabs.sendMessage(tab.id, { type: 'SYNC_MOCK_RULES' });
        } catch {
          // Ignore errors for tabs without content scripts
        }
      }
    }
  } catch (error) {
    console.error('Failed to notify content scripts:', error);
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
        case 'GET_MOCK_RULES': {
          const rules = await Storage.getRules();
          sendResponse({ success: true, rules });
          break;
        }
        case 'FIND_MOCK_RULE': {
          const url = msg.url;
          console.log('[FlowCraft Background] Finding mock rule for:', url);

          if (!url) {
            console.error('[FlowCraft Background] No URL provided');
            sendResponse({ success: false, error: 'URL is required' });
            break;
          }

          const matchedRule = ResponseMocker.findMatchingRule(url);

          if (matchedRule && matchedRule.action.type === 'mock_response') {
            console.log('[FlowCraft Background] Found matching rule:', matchedRule.id, matchedRule.name);
            sendResponse({
              success: true,
              ruleId: matchedRule.id,
              mockResponse: matchedRule.action.mockResponse,
            });
          } else {
            console.log('[FlowCraft Background] No matching mock rule for:', url);
            sendResponse({ success: false });
          }
          break;
        }
        case 'INJECT_MAIN_WORLD': {
          // Get the tab ID from the sender
          if (_sender.tab?.id) {
            console.log('[FlowCraft Background] Received INJECT_MAIN_WORLD request for tab', _sender.tab.id);
            await injectMainWorldInterceptor(_sender.tab.id);
            sendResponse({ success: true });
          } else {
            console.error('[FlowCraft Background] INJECT_MAIN_WORLD: No tab ID in sender');
            sendResponse({ success: false, error: 'No tab ID' });
          }
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

// Import the MAIN world interceptor code
import { MAIN_WORLD_INTERCEPTOR } from '../content/main-world-interceptor-code';

// Function to inject MAIN world interceptor into a tab
async function injectMainWorldInterceptor(tabId: number): Promise<void> {
  try {
    // Use chrome.scripting directly as browser polyfill may not support 'world' parameter properly
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (code: string) => {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
        eval(code);
      },
      args: [MAIN_WORLD_INTERCEPTOR],
      injectImmediately: true,
    });
    console.log('[FlowCraft Background] Injected MAIN world interceptor into tab', tabId);
  } catch (error) {
    console.error('[FlowCraft Background] Failed to inject MAIN world interceptor:', error);
  }
}

// Listen for page navigation to inject scripts
browser.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) {
    // Inject MAIN world interceptor first (bypasses CSP)
    await injectMainWorldInterceptor(details.tabId);

    // Then handle user script injection
    void ScriptInjector.handleNavigation(details.tabId, details.url);
  }
});
