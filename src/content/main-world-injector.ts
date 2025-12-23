/**
 * MAIN World Injector
 * Injects interceptor immediately at document_start to beat Zone.js
 * This runs BEFORE Zone.js patches XMLHttpRequest
 *
 * IMPORTANT: Cannot use DOM script injection due to CSP restrictions.
 * This content script tells the background to inject via chrome.scripting API.
 *
 * Note: This file is kept minimal since we're moving injection to background.
 * The background script will inject using webNavigation.onCommitted which
 * happens early enough to beat Zone.js in most cases.
 */

// Request background script to inject the MAIN world interceptor
// Background script will use chrome.scripting.executeScript which bypasses CSP
chrome.runtime.sendMessage({ type: 'INJECT_MAIN_WORLD' }).catch(() => {
  // Ignore errors if background isn't ready yet
  // The webNavigation.onCommitted listener will handle injection as fallback
});
