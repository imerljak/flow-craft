/**
 * Simple HTTP server for serving the mock test app
 * Run: node tests/fixtures/mock-test-app/server.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3456;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse requested file
  const filePath = req.url === '/' || req.url === ''
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${filePath}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`  → 404 Not Found`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  // Read and serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`  → 500 Error: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';

    console.log(`  → 200 OK (${contentType})`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║             FlowCraft Mock Test Server Running                ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 Server URL: http://localhost:${PORT}`);
  console.log('');
  console.log('  📝 Test Instructions:');
  console.log('  1. Load FlowCraft extension in Chrome');
  console.log('  2. Create mock rule for: http://localhost:3456/data.json');
  console.log('  3. Open http://localhost:3456 in your browser');
  console.log('  4. Click the test buttons to verify interception');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error('   Please stop the other server or change the PORT in server.js');
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
