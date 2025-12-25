/**
 * MAIN World Interceptor Code
 * This code runs in the page's MAIN JavaScript context to intercept fetch/XHR
 */

export const MAIN_WORLD_INTERCEPTOR = `
(() => {
  console.log('[FlowCraft MAIN] Initializing MAIN world interceptor');

  const originalFetch = window.fetch;
  const OriginalXHR = window.XMLHttpRequest;

  let bridgeReady = false;

  // Listen for bridge ready signal
  window.addEventListener('message', (event) => {
    if (event.source === window && event.data?.type === 'FLOWCRAFT_BRIDGE_READY') {
      bridgeReady = true;
      console.log('[FlowCraft MAIN] Bridge is ready');
    }
  });

  // Wait for bridge to be ready
  async function waitForBridge() {
    if (bridgeReady) return true;

    return new Promise((resolve) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (bridgeReady) {
          clearInterval(checkInterval);
          console.log('[FlowCraft MAIN] Bridge ready after', attempts * 50, 'ms');
          resolve(true);
        } else if (attempts >= 100) {
          // 100 * 50ms = 5s timeout
          clearInterval(checkInterval);
          console.warn('[FlowCraft MAIN] Bridge ready timeout after 5s, proceeding anyway');
          resolve(false);
        }
      }, 50);
    });
  }

  // Check for mock once (single attempt)
  async function checkForMockOnce(url) {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36);

      const messageHandler = (event) => {
        if (event.data?.type === 'FLOWCRAFT_MOCK_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', messageHandler);
          // Include ruleId in the response
          const mockResponse = event.data.mockResponse;
          if (mockResponse && event.data.ruleId) {
            mockResponse.ruleId = event.data.ruleId;
          }
          resolve(mockResponse);
        }
      };

      window.addEventListener('message', messageHandler);

      window.postMessage({ type: 'FLOWCRAFT_CHECK_MOCK', requestId, url }, '*');

      // Increased timeout from 1s to 5s for service worker wake-up
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve(null);
      }, 5000);
    });
  }

  // Check for mock with retry logic
  async function checkForMock(url, maxRetries = 2) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log('[FlowCraft MAIN] Checking for mock (attempt', attempt + 1, '):', url);
        const result = await checkForMockOnce(url);
        if (result) {
          console.log('[FlowCraft MAIN] Mock found:', result);
          return result;
        }
        console.log('[FlowCraft MAIN] No mock found for:', url);
        return null;
      } catch (error) {
        console.warn('[FlowCraft MAIN] Check failed (attempt', attempt + 1, '):', error);
        if (attempt < maxRetries - 1) {
          // Wait 200ms before retry
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    console.warn('[FlowCraft MAIN] All retry attempts failed for:', url);
    return null;
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

  // Initialize interceptors immediately (don't wait for bridge)
  console.log('[FlowCraft MAIN] Installing interceptors immediately...');

  // Helper to log request start
  function logRequest(url, method, matchedRuleId, action, mockDelay) {
    return new Promise((resolve) => {
      const messageHandler = (event) => {
        if (event.data?.type === 'FLOWCRAFT_LOG_REQUEST_RESPONSE') {
          window.removeEventListener('message', messageHandler);
          resolve(event.data.logId);
        }
      };

      window.addEventListener('message', messageHandler);

      window.postMessage({
        type: 'FLOWCRAFT_LOG_REQUEST',
        request: {
          url,
          method,
        },
        interception: {
          action,
          matchedRuleId,
          mockDelay,
        }
      }, '*');

      // Timeout after 500ms
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve('');
      }, 500);
    });
  }

  // Helper to log response
  function logResponse(logId, status, statusText) {
    if (!logId) return;

    window.postMessage({
      type: 'FLOWCRAFT_LOG_RESPONSE',
      logId,
      response: {
        status,
        statusText,
      }
    }, '*');
  }

  window.fetch = async function(input, init) {
    // Wait for bridge before checking for mocks
    if (!bridgeReady) {
      console.log('[FlowCraft MAIN] Waiting for bridge in fetch...');
      await waitForBridge();
    }

    const startTime = performance.now();

    // Convert input to absolute URL for matching
    let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Convert relative URLs to absolute URLs
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//')) {
      const absoluteUrl = new URL(url, window.location.href);
      url = absoluteUrl.href;
    }

    // Determine method
    const method = (init?.method || 'GET').toUpperCase();

    const mockResponse = await checkForMock(url);

    if (mockResponse) {
      console.log('[FlowCraft MAIN] Mocking fetch:', url, mockResponse);

      // Log mocked request
      const logId = await logRequest(url, method, mockResponse.ruleId, 'mocked', mockResponse.delay || 0);

      if (mockResponse.delay && mockResponse.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
      }

      const response = new Response(mockResponse.body || '', {
        status: mockResponse.statusCode,
        statusText: mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode),
        headers: new Headers(mockResponse.headers || {})
      });

      // Log response
      logResponse(logId, mockResponse.statusCode, mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode));

      return response;
    }

    // Log original request
    const logId = await logRequest(url, method, undefined, 'original', 0);

    // Proceed with original fetch
    try {
      const response = await originalFetch.call(this, input, init);

      // Log response
      logResponse(logId, response.status, response.statusText);

      return response;
    } catch (error) {
      // Log error (as failed response)
      logResponse(logId, 0, 'Network Error');
      throw error;
    }
  };

  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    let requestUrl = '';
    let requestMethod = 'GET';
    let xhrLogId = '';

    const originalOpen = xhr.open;
    const originalSend = xhr.send;

    xhr.open = function(...args) {
      requestUrl = typeof args[1] === 'string' ? args[1] : args[1].href;
      requestMethod = (args[0] || 'GET').toUpperCase();
      return originalOpen.apply(this, args);
    };

    xhr.send = async function(body) {
      // Wait for bridge before checking for mocks
      if (!bridgeReady) {
        console.log('[FlowCraft MAIN] Waiting for bridge in XHR...');
        await waitForBridge();
      }

      // Convert relative URLs to absolute URLs
      let absoluteUrl = requestUrl;
      if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://') && !absoluteUrl.startsWith('//')) {
        const url = new URL(absoluteUrl, window.location.href);
        absoluteUrl = url.href;
      }

      const mockResponse = await checkForMock(absoluteUrl);

      if (mockResponse) {
        console.log('[FlowCraft MAIN] Mocking XHR:', requestUrl, mockResponse);

        // Log mocked request
        xhrLogId = await logRequest(absoluteUrl, requestMethod, mockResponse.ruleId, 'mocked', mockResponse.delay || 0);

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
          // Log response after events are dispatched
          logResponse(xhrLogId, mockResponse.statusCode, mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode));
        }, 0);

        return;
      }

      // Log original request
      xhrLogId = await logRequest(absoluteUrl, requestMethod, undefined, 'original', 0);

      // Hook into load/error events to log response
      xhr.addEventListener('load', function() {
        logResponse(xhrLogId, xhr.status, xhr.statusText);
      });

      xhr.addEventListener('error', function() {
        logResponse(xhrLogId, 0, 'Network Error');
      });

      return originalSend.call(this, body);
    };

    return xhr;
  };

  Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR);
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  console.log('[FlowCraft MAIN] Interceptors installed');
})();
`;
