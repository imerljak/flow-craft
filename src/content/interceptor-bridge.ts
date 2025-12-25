/**
 * Content Script Bridge
 * Facilitates communication between the MAIN world interceptor and the background script
 */

console.log('[FlowCraft Bridge] Bridge script loaded');

// Listen for messages from the MAIN world interceptor
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return;

  if (event.data?.type === 'FLOWCRAFT_CHECK_MOCK') {
    const { requestId, url } = event.data;

    console.log('[FlowCraft Bridge] Received mock check:', { requestId, url });

    try {
      // Ask background script for mock rule
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_MOCK_RULE',
        url,
      });

      console.log('[FlowCraft Bridge] Background response:', {
        requestId,
        success: response?.success,
        hasMock: !!response?.mockResponse,
      });

      // Send response back to MAIN world
      window.postMessage(
        {
          type: 'FLOWCRAFT_MOCK_RESPONSE',
          requestId,
          mockResponse: response?.success ? response.mockResponse : null,
          ruleId: response?.ruleId,
        },
        '*'
      );

      console.log('[FlowCraft Bridge] Sent response to MAIN world:', requestId);
    } catch (error) {
      console.error('[FlowCraft Bridge] Error:', error);
      // Send null response
      window.postMessage(
        {
          type: 'FLOWCRAFT_MOCK_RESPONSE',
          requestId,
          mockResponse: null,
        },
        '*'
      );
    }
  } else if (event.data?.type === 'FLOWCRAFT_LOG_REQUEST') {
    // Log request to background
    const { request, interception } = event.data;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOG_REQUEST',
        request,
        interception,
      });

      // Send logId back to MAIN world
      window.postMessage(
        {
          type: 'FLOWCRAFT_LOG_REQUEST_RESPONSE',
          logId: response?.logId || '',
        },
        '*'
      );
    } catch (error) {
      console.error('[FlowCraft Bridge] Error logging request:', error);
      window.postMessage(
        {
          type: 'FLOWCRAFT_LOG_REQUEST_RESPONSE',
          logId: '',
        },
        '*'
      );
    }
  } else if (event.data?.type === 'FLOWCRAFT_LOG_RESPONSE') {
    // Log response to background
    const { logId, response } = event.data;

    try {
      await chrome.runtime.sendMessage({
        type: 'LOG_RESPONSE',
        logId,
        response,
      });
    } catch (error) {
      console.error('[FlowCraft Bridge] Error logging response:', error);
    }
  }
});

console.log('[FlowCraft Bridge] Bridge ready, broadcasting...');

// Broadcast ready state immediately
window.postMessage({ type: 'FLOWCRAFT_BRIDGE_READY' }, '*');

// Continue broadcasting for 2 seconds to catch late MAIN world injections
let readyBroadcastCount = 0;
const readyInterval = setInterval(() => {
  window.postMessage({ type: 'FLOWCRAFT_BRIDGE_READY' }, '*');
  readyBroadcastCount++;
  if (readyBroadcastCount >= 20) {
    // 20 * 100ms = 2s
    clearInterval(readyInterval);
    console.log('[FlowCraft Bridge] Ready broadcast complete');
  }
}, 100);
