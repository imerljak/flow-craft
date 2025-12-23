/**
 * MAIN World Injector
 * Injects interceptor immediately at document_start to beat Zone.js
 * This runs BEFORE Zone.js patches XMLHttpRequest
 *
 * IMPORTANT: This must be injected as early as possible to intercept
 * libraries like Zone.js that patch XHR during page initialization.
 *
 * Strategy: Insert as FIRST child of <html> element, before <head>
 * This ensures our interceptor runs before ANY inline scripts in <head>
 */

import { MAIN_WORLD_INTERCEPTOR } from './main-world-interceptor-code';

// Inject immediately (synchronously) at document_start
// Insert as FIRST child of <html> to run before Zone.js in <head>
const script = document.createElement('script');
script.textContent = MAIN_WORLD_INTERCEPTOR;

// Try to inject as early as possible
if (document.documentElement) {
  // Insert as first child of <html> (before <head>)
  if (document.documentElement.firstChild) {
    document.documentElement.insertBefore(script, document.documentElement.firstChild);
    console.log('[FlowCraft Injector] Injected as FIRST child of <html>');
  } else {
    document.documentElement.appendChild(script);
    console.log('[FlowCraft Injector] Injected into empty <html>');
  }
} else {
  // Fallback: wait for documentElement
  const observer = new MutationObserver(() => {
    if (document.documentElement) {
      observer.disconnect();
      if (document.documentElement.firstChild) {
        document.documentElement.insertBefore(script, document.documentElement.firstChild);
      } else {
        document.documentElement.appendChild(script);
      }
      script.remove();
      console.log('[FlowCraft Injector] Injected via MutationObserver');
    }
  });
  observer.observe(document, { childList: true, subtree: true });
}

// Remove script element after execution
script.remove();

console.log('[FlowCraft Injector] MAIN world interceptor injection complete');
