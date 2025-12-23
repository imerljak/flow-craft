/**
 * MAIN World Injector
 * Injects interceptor immediately at document_start to beat Zone.js
 * This runs BEFORE Zone.js patches XMLHttpRequest
 *
 * IMPORTANT: This must be injected as early as possible to intercept
 * libraries like Zone.js that patch XHR during page initialization.
 */

import { MAIN_WORLD_INTERCEPTOR } from './main-world-interceptor-code';

// Inject immediately (synchronously) at document_start
// Using inline script injection to ensure it runs ASAP
const script = document.createElement('script');
script.textContent = MAIN_WORLD_INTERCEPTOR;
(document.head || document.documentElement).appendChild(script);
script.remove();

console.log('[FlowCraft Injector] MAIN world interceptor injected at document_start');
