/**
 * Simple HTTP server for serving test fixtures
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, '../fixtures/mock-test-app');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
};

export class TestServer {
  private server: http.Server | null = null;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
  }

  start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
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
          ? path.join(FIXTURES_DIR, 'index.html')
          : path.join(FIXTURES_DIR, req.url || '');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        // Read and serve file
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
          }

          const ext = path.extname(filePath);
          const contentType = MIME_TYPES[ext] || 'text/plain';

          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        });
      });

      this.server.listen(this.port, () => {
        console.log(`[Test Server] Listening on http://localhost:${this.port}`);
        resolve(`http://localhost:${this.port}`);
      });

      this.server.on('error', (err) => {
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else {
            console.log('[Test Server] Stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
