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

    console.log('[FlowCraft Bridge] Checking for mock rule:', url);

    try {
      // Ask background script for mock rule
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_MOCK_RULE',
        url,
      });

      console.log('[FlowCraft Bridge] Background response:', response);

      // Send response back to MAIN world
      window.postMessage(
        {
          type: 'FLOWCRAFT_MOCK_RESPONSE',
          requestId,
          mockResponse: response?.success ? response.mockResponse : null,
        },
        '*'
      );
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
  }
});

console.log('[FlowCraft Bridge] Bridge ready');
