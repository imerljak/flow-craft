/**
 * Simple test app that fetches data.json
 * This will be intercepted by FlowCraft extension
 */

console.log('[Test App] Starting...');

// Function to fetch data
async function fetchData() {
  console.log('[Test App] Fetching data.json...');

  try {
    const response = await fetch('./data.json');
    const data = await response.json();

    console.log('[Test App] Received response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });

    // Display the data
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
      <h2>Response Status: ${response.status} ${response.statusText}</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;

    // Store result for E2E test
    window.testResult = {
      status: response.status,
      statusText: response.statusText,
      data
    };

    return data;
  } catch (error) {
    console.error('[Test App] Error fetching data:', error);
    document.getElementById('result').innerHTML = `
      <h2>Error</h2>
      <pre>${error.message}</pre>
    `;
    throw error;
  }
}

// Function to fetch using XMLHttpRequest
function fetchDataXHR() {
  console.log('[Test App] Fetching data.json via XHR...');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
      console.log('[Test App XHR] Received response:', {
        status: xhr.status,
        statusText: xhr.statusText,
        responseText: xhr.responseText
      });

      const data = JSON.parse(xhr.responseText);

      // Display the data
      const resultDiv = document.getElementById('xhr-result');
      resultDiv.innerHTML = `
        <h2>XHR Response Status: ${xhr.status} ${xhr.statusText}</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `;

      // Store result for E2E test
      window.xhrTestResult = {
        status: xhr.status,
        statusText: xhr.statusText,
        data
      };

      resolve(data);
    };

    xhr.onerror = function() {
      const error = new Error('XHR request failed');
      console.error('[Test App XHR] Error:', error);
      reject(error);
    };

    xhr.open('GET', './data.json');
    xhr.send();
  });
}

// Auto-run on page load
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Test App] DOM loaded, ready to fetch');
});

// Expose functions globally for testing
window.testApp = {
  fetchData,
  fetchDataXHR
};

console.log('[Test App] Ready. Call window.testApp.fetchData() or window.testApp.fetchDataXHR()');
