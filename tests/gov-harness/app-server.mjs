// Harness app server: serves the production build from dist/ and mounts the
// REAL api/fetch-proxy.ts and api/browser-fetch.ts handlers (compiled by
// build-api.mjs) behind a minimal Vercel-compatible request/response adapter.
// This is the piece `vite preview` can't do — it 404s /api/*, so the
// serverless code was previously never executed in tests.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

export const APP_PORT = 8090;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// Adapt a (VercelRequest, VercelResponse) handler to plain node http.
const adaptVercelHandler = (handler) => async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(url.searchParams);
  req.body = undefined;
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
  }
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (body) => { res.end(body); return res; };
  try {
    await handler(req, res);
  } catch (err) {
    console.error('[app-server] handler crashed:', err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: String(err) }));
    }
  }
};

export async function startAppServer({ distDir, apiBuildDir }) {
  const { default: fetchProxy } = await import(join(apiBuildDir, 'fetch-proxy.js'));
  const { default: browserFetch } = await import(join(apiBuildDir, 'browser-fetch.js'));
  const routes = {
    '/api/fetch-proxy': adaptVercelHandler(fetchProxy),
    '/api/browser-fetch': adaptVercelHandler(browserFetch),
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const route = routes[url.pathname];
    if (route) return route(req, res);

    // Static files with SPA fallback
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    try {
      const body = await readFile(join(distDir, filePath));
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      try {
        const body = await readFile(join(distDir, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    }
  });

  return new Promise((resolve) => {
    server.listen(APP_PORT, '127.0.0.1', () => resolve(server));
  });
}
