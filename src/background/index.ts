/**
 * Background service worker for FlowCraft
 * Handles request interception and rule application
 */

import { Storage } from '@storage/index';
import { RequestInterceptor } from './requestInterceptor';
import { ScriptInjector } from './scriptInjector';
import { ResponseMocker } from './responseMocker';
import { HttpLogger } from './httpLogger';
import { ConflictDetector } from './conflictDetector';
import browser from 'webextension-polyfill';
import { Rule, LogActionType } from '@shared/types';

/**
 * Message types for runtime communication
 */
interface BackgroundMessage {
  type:
    | 'GET_RULES'
    | 'SAVE_RULE'
    | 'DELETE_RULE'
    | 'SYNC_RULES'
    | 'GET_MOCK_RULES'
    | 'FIND_MOCK_RULE'
    | 'INJECT_MAIN_WORLD'
    | 'GET_LOGS'
    | 'GET_FILTERED_LOGS'
    | 'CLEAR_LOGS'
    | 'EXPORT_LOGS'
    | 'EXPORT_LOGS_CSV'
    | 'GET_LOG_STATS'
    | 'LOG_REQUEST'
    | 'LOG_RESPONSE'
    | 'EXPORT_RULES'
    | 'IMPORT_RULES'
    | 'DETECT_CONFLICTS'
    | 'DETECT_RULE_CONFLICTS';
  data?: Rule | string | unknown;
  url?: string;
  tabId?: number;
  filter?: unknown;
  logId?: string;
  request?: unknown;
  response?: unknown;
  interception?: unknown;
  includeSettings?: boolean;
  includeGroups?: boolean;
  ruleIds?: string[];
  options?: unknown;
  rule?: Rule;
}

/**
 * Initialize extension and sync rules
 */
async function initializeExtension(): Promise<void> {
  await Storage.initialize();
  await HttpLogger.initialize();
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
  if (areaName === 'local') {
    if (changes.rules) {
      void syncRules();
    }
    if (changes.settings) {
      // Update logger settings
      void (async () => {
        const settings = await Storage.getSettings();
        await HttpLogger.updateSettings(settings);
      })();
    }
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
        case 'GET_LOGS': {
          const logs = await HttpLogger.getLogs();
          sendResponse({ success: true, logs });
          break;
        }
        case 'GET_FILTERED_LOGS': {
          const logs = await HttpLogger.getFilteredLogs(msg.filter as Parameters<typeof HttpLogger.getFilteredLogs>[0]);
          sendResponse({ success: true, logs });
          break;
        }
        case 'CLEAR_LOGS': {
          await HttpLogger.clearLogs();
          sendResponse({ success: true });
          break;
        }
        case 'EXPORT_LOGS': {
          const json = await HttpLogger.exportLogs(msg.filter as Parameters<typeof HttpLogger.exportLogs>[0]);
          sendResponse({ success: true, data: json });
          break;
        }
        case 'EXPORT_LOGS_CSV': {
          const csv = await HttpLogger.exportLogsCSV(msg.filter as Parameters<typeof HttpLogger.exportLogsCSV>[0]);
          sendResponse({ success: true, data: csv });
          break;
        }
        case 'GET_LOG_STATS': {
          const stats = await HttpLogger.getStats();
          sendResponse({ success: true, stats });
          break;
        }
        case 'LOG_REQUEST': {
          const logId = await HttpLogger.logRequest(
            msg.request as Parameters<typeof HttpLogger.logRequest>[0],
            msg.interception as Parameters<typeof HttpLogger.logRequest>[1]
          );
          sendResponse({ success: true, logId });
          break;
        }
        case 'LOG_RESPONSE': {
          await HttpLogger.logResponse(
            msg.logId as string,
            msg.response as Parameters<typeof HttpLogger.logResponse>[1]
          );
          sendResponse({ success: true });
          break;
        }
        case 'EXPORT_RULES': {
          const exportData = await Storage.exportRules({
            includeSettings: msg.includeSettings ?? false,
            includeGroups: msg.includeGroups ?? true,
            ruleIds: msg.ruleIds,
          });
          const jsonString = JSON.stringify(exportData, null, 2);
          sendResponse({ success: true, data: jsonString });
          break;
        }
        case 'IMPORT_RULES': {
          const result = await Storage.importRules(
            msg.data,
            msg.options as Parameters<typeof Storage.importRules>[1]
          );
          // Sync rules after import to apply changes
          if (result.success && result.rulesImported > 0) {
            await syncRules();
          }
          sendResponse({ success: true, result });
          break;
        }
        case 'DETECT_CONFLICTS': {
          const rules = await Storage.getRules();
          const conflicts = ConflictDetector.detectConflicts(rules);
          sendResponse({ success: true, conflicts });
          break;
        }
        case 'DETECT_RULE_CONFLICTS': {
          if (!msg.rule) {
            sendResponse({ success: false, error: 'Rule is required' });
            break;
          }
          const allRules = await Storage.getRules();
          const conflicts = ConflictDetector.detectConflictsForRule(msg.rule, allRules);
          sendResponse({ success: true, conflicts });
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

// Listen for declarativeNetRequest rule matches (for logging)
// Note: This requires declarativeNetRequestFeedback permission
if (chrome.declarativeNetRequest?.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
    // Get the matched rule
    const rule = RequestInterceptor.getRuleByNumericId(details.rule.ruleId);
    if (!rule) return;

    // Determine the action type from the rule
    let action: LogActionType = LogActionType.MODIFIED;
    const actionDetails: Record<string, unknown> = {};

    if (rule.action.type === 'url_redirect') {
      action = LogActionType.REDIRECTED;
      actionDetails.redirectUrl = rule.action.redirectUrl;
    } else if (rule.action.type === 'request_block') {
      action = LogActionType.BLOCKED;
    } else if (rule.action.type === 'header_modification') {
      action = LogActionType.MODIFIED;
      actionDetails.modifiedHeaders = rule.action.headers.map((h) => h.name);
    } else if (rule.action.type === 'query_param') {
      action = LogActionType.MODIFIED;
      actionDetails.modifiedParams = rule.action.params.map((p) => p.name);
    }

    // Log the request (fire and forget)
    void HttpLogger.logRequest(
      {
        url: details.request.url,
        method: details.request.method as Parameters<typeof HttpLogger.logRequest>[0]['method'],
        tabId: details.request.tabId,
        frameId: details.request.frameId,
      },
      {
        action,
        matchedRuleId: rule.id,
        matchedRuleName: rule.name,
        actionDetails,
      }
    ).then((logId) => {
      // For blocks and redirects, immediately complete the log
      if (action === LogActionType.BLOCKED) {
        void HttpLogger.logResponse(logId, { status: 0, statusText: 'Blocked by Rule' });
      } else if (action === LogActionType.REDIRECTED && actionDetails.redirectUrl) {
        void HttpLogger.logResponse(logId, {
          status: 302,
          statusText: 'Redirected',
        });
      }
      // For modifications, the response will be logged by fetch/XHR interceptors
    });
  });
}
