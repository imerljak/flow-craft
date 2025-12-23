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
  type: 'GET_RULES' | 'SAVE_RULE' | 'DELETE_RULE' | 'SYNC_RULES' | 'GET_MOCK_RULES' | 'FIND_MOCK_RULE';
  data?: Rule | string;
  url?: string;
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
          if (!url) {
            sendResponse({ success: false, error: 'URL is required' });
            break;
          }

          const matchedRule = ResponseMocker.findMatchingRule(url);
          if (matchedRule && matchedRule.action.type === 'mock_response') {
            sendResponse({
              success: true,
              ruleId: matchedRule.id,
              mockResponse: matchedRule.action.mockResponse,
            });
          } else {
            sendResponse({ success: false });
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

// MAIN world interceptor code (injected into page context)
const MAIN_WORLD_INTERCEPTOR = `
(() => {
  console.log('[FlowCraft] Initializing MAIN world interceptor');

  const originalFetch = window.fetch;
  const OriginalXHR = window.XMLHttpRequest;

  async function checkForMock(url) {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36);

      const messageHandler = (event) => {
        if (event.data?.type === 'FLOWCRAFT_MOCK_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', messageHandler);
          resolve(event.data.mockResponse);
        }
      };

      window.addEventListener('message', messageHandler);

      window.postMessage({ type: 'FLOWCRAFT_CHECK_MOCK', requestId, url }, '*');

      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve(null);
      }, 1000);
    });
  }

  function getDefaultStatusText(statusCode) {
    const statusTexts = {
      200: 'OK', 201: 'Created', 204: 'No Content',
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
      404: 'Not Found', 500: 'Internal Server Error',
      502: 'Bad Gateway', 503: 'Service Unavailable'
    };
    return statusTexts[statusCode] || 'Unknown';
  }

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const mockResponse = await checkForMock(url);

    if (mockResponse) {
      console.log('[FlowCraft] Mocking fetch:', url);
      if (mockResponse.delay && mockResponse.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
      }
      return new Response(mockResponse.body || '', {
        status: mockResponse.statusCode,
        statusText: mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode),
        headers: new Headers(mockResponse.headers || {})
      });
    }

    return originalFetch.call(this, input, init);
  };

  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let requestUrl = '';

    const originalOpen = xhr.open;
    const originalSend = xhr.send;

    xhr.open = function(...args) {
      requestUrl = typeof args[1] === 'string' ? args[1] : args[1].href;
      return originalOpen.apply(this, args);
    };

    xhr.send = async function(body) {
      const mockResponse = await checkForMock(requestUrl);

      if (mockResponse) {
        console.log('[FlowCraft] Mocking XHR:', requestUrl);

        if (mockResponse.delay && mockResponse.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
        }

        Object.defineProperty(xhr, 'status', { get: () => mockResponse.statusCode });
        Object.defineProperty(xhr, 'statusText', { get: () => mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode) });
        Object.defineProperty(xhr, 'response', { get: () => mockResponse.body || '' });
        Object.defineProperty(xhr, 'responseText', { get: () => mockResponse.body || '' });
        Object.defineProperty(xhr, 'readyState', { get: () => 4 });

        const originalGetResponseHeader = xhr.getResponseHeader;
        xhr.getResponseHeader = function(name) {
          if (mockResponse.headers) {
            return mockResponse.headers[name] || mockResponse.headers[name.toLowerCase()] || null;
          }
          return originalGetResponseHeader.call(this, name);
        };

        const originalGetAllResponseHeaders = xhr.getAllResponseHeaders;
        xhr.getAllResponseHeaders = function() {
          if (mockResponse.headers) {
            return Object.entries(mockResponse.headers).map(([k, v]) => k + ': ' + v).join('\\r\\n');
          }
          return originalGetAllResponseHeaders.call(this);
        };

        setTimeout(() => {
          xhr.dispatchEvent(new Event('loadstart'));
          xhr.dispatchEvent(new Event('readystatechange'));
          xhr.dispatchEvent(new Event('load'));
          xhr.dispatchEvent(new Event('loadend'));
        }, 0);

        return;
      }

      return originalSend.call(this, body);
    };

    return xhr;
  };

  Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR);
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  console.log('[FlowCraft] MAIN world interceptor ready');
})();
`;

// Listen for page navigation to inject scripts
browser.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0) {
    // Only handle main frame navigation
    void ScriptInjector.handleNavigation(details.tabId, details.url);

    // Inject the MAIN world interceptor for mock responses
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const func = new Function(MAIN_WORLD_INTERCEPTOR) as () => void;
      await browser.scripting.executeScript({
        target: { tabId: details.tabId },
        func,
        world: 'MAIN' as chrome.scripting.ExecutionWorld,
        injectImmediately: true,
      });
      console.log('[FlowCraft] Injected MAIN world interceptor into tab', details.tabId);
    } catch (error) {
      console.error('[FlowCraft] Failed to inject MAIN world interceptor:', error);
    }
  }
});
