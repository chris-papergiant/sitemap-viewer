// Handler-level tests for api/fetch-proxy.ts — runs the real compiled code
// with fake request/response objects. The mock gov server must be running.

import { join } from 'node:path';
import { GOV_PORT } from './mock-gov-server.mjs';

const GOV = (host, path) => `http://${host}:${GOV_PORT}${path}`;

// Minimal VercelRequest/VercelResponse doubles
const makeReq = ({ url, method = 'GET', headers = {}, body } = {}) => {
  const parsed = new URL(url || 'http://localhost:8090/api/fetch-proxy', 'http://localhost:8090');
  return {
    method,
    url: parsed.pathname + parsed.search,
    headers: {
      host: 'localhost:8090',
      referer: 'http://localhost:8090/',
      ...headers,
    },
    query: Object.fromEntries(parsed.searchParams),
    body,
    socket: { remoteAddress: '127.0.0.1' },
  };
};

const makeRes = () => {
  const res = { statusCode: 200, payload: undefined };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.payload = obj; return res; };
  return res;
};

const callProxy = async (handler, { targetUrl, head, headers, ip } = {}) => {
  const params = new URLSearchParams({ url: targetUrl });
  if (head) params.set('head', '1');
  const req = makeReq({
    url: `/api/fetch-proxy?${params}`,
    headers: { ...(headers || {}), ...(ip ? { 'x-forwarded-for': ip } : {}) },
  });
  const res = makeRes();
  await handler(req, res);
  return res;
};

export async function runUnitTests({ apiBuildDir }) {
  const { default: handler } = await import(join(apiBuildDir, 'fetch-proxy.js'));
  const results = [];
  const test = async (name, fn) => {
    try {
      await fn();
      results.push({ name, pass: true });
    } catch (err) {
      results.push({ name, pass: false, error: err.message });
    }
  };
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  const TRUST = 'FETCH_PROXY_TRUST_HOSTS';
  const savedTrust = process.env[TRUST];
  delete process.env[TRUST]; // guards active by default

  await test('U1 rejects requests with no Origin/Referer', async () => {
    const req = makeReq({ url: `/api/fetch-proxy?url=${encodeURIComponent('https://example.com/')}` });
    delete req.headers.referer;
    const res = makeRes();
    await handler(req, res);
    assert(res.statusCode === 403, `expected 403, got ${res.statusCode}`);
  });

  await test('U2 rejects cross-origin Referer', async () => {
    const res = await callProxy(handler, {
      targetUrl: 'https://example.com/',
      headers: { referer: 'https://evil.example.net/page' },
    });
    assert(res.statusCode === 403, `expected 403, got ${res.statusCode}`);
  });

  await test('U3 rejects literal private hosts (127.0.0.1, 10.x, 169.254.x, ::1)', async () => {
    for (const target of ['http://127.0.0.1/x', 'http://10.1.2.3/x', 'http://169.254.169.254/latest', 'http://[::1]:80/x', 'http://localhost/x']) {
      const res = await callProxy(handler, { targetUrl: target });
      assert(res.statusCode === 400, `${target}: expected 400, got ${res.statusCode}`);
    }
  });

  await test('U4 rejects hostnames whose DNS resolves to private addresses', async () => {
    // /etc/hosts maps this to 127.0.0.1; with no trust env it must be blocked
    const res = await callProxy(handler, { targetUrl: GOV('www.basic.gov.au', '/sitemap.xml') });
    assert(res.statusCode === 400, `expected 400, got ${res.statusCode}`);
    assert(/private/i.test(res.payload?.error || ''), `unexpected error: ${res.payload?.error}`);
  });

  // Remaining tests need the mock host reachable
  process.env[TRUST] = '.gov.au';

  await test('U5 fetches gov sitemap with browser headers (bot filter passed)', async () => {
    const res = await callProxy(handler, { targetUrl: GOV('www.basic.gov.au', '/sitemap.xml') });
    assert(res.statusCode === 200, `expected 200, got ${res.statusCode}`);
    assert(res.payload.success === true, `not success: ${res.payload.error}`);
    assert(res.payload.status === 200, `upstream status ${res.payload.status}`);
    assert(res.payload.content.includes('<urlset'), 'no urlset in content');
  });

  await test('U6 blocks redirect hops to private addresses', async () => {
    const res = await callProxy(handler, { targetUrl: GOV('www.basic.gov.au', '/redirect-private') });
    assert(res.statusCode === 400, `expected 400, got ${res.statusCode}`);
    assert(/private/i.test(res.payload?.error || ''), `unexpected error: ${res.payload?.error}`);
  });

  await test('U7 follows same-trust redirects and reports initialStatus', async () => {
    const res = await callProxy(handler, { targetUrl: GOV('www.redirect.gov.au', '/sitemap.xml') });
    assert(res.payload.success === true, `not success: ${res.payload?.error}`);
    assert(res.payload.initialStatus === 301, `initialStatus ${res.payload.initialStatus}`);
    assert(res.payload.redirected === true, 'redirected flag not set');
    assert(res.payload.content.includes('<urlset'), 'no urlset after redirect');
  });

  await test('U8 HEAD falls back to GET on 405', async () => {
    const res = await callProxy(handler, { targetUrl: GOV('www.basic.gov.au', '/head-405'), head: true });
    assert(res.payload.success === true, `not success: ${res.payload?.error}`);
    assert(res.payload.status === 200, `status ${res.payload.status}`);
  });

  await test('U9 rejects oversized content before hitting the platform cap', async () => {
    const res = await callProxy(handler, { targetUrl: GOV('www.basic.gov.au', '/huge.xml') });
    assert(res.payload.success === false, 'expected failure');
    assert(/too large/i.test(res.payload.error), `unexpected error: ${res.payload.error}`);
  });

  await test('U10 enforces the per-IP rate limit', async () => {
    process.env.FETCH_PROXY_RATE_LIMIT = '3';
    try {
      const codes = [];
      for (let i = 0; i < 4; i++) {
        const res = await callProxy(handler, {
          targetUrl: GOV('www.basic.gov.au', '/sitemap.xml'),
          ip: '203.0.113.77',
        });
        codes.push(res.statusCode);
      }
      assert(codes.slice(0, 3).every(c => c === 200), `first three: ${codes}`);
      assert(codes[3] === 429, `fourth call: expected 429, got ${codes[3]}`);
    } finally {
      delete process.env.FETCH_PROXY_RATE_LIMIT;
    }
  });

  if (savedTrust === undefined) delete process.env[TRUST];
  else process.env[TRUST] = savedTrust;
  // Leave trust on for the E2E phase — run.mjs sets it explicitly anyway
  return results;
}

export async function runBrowserFetchTests({ apiBuildDir }) {
  const { default: handler } = await import(join(apiBuildDir, 'browser-fetch.js'));
  const results = [];
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  const post = async (body, headers = {}) => {
    const req = makeReq({ url: '/api/browser-fetch', method: 'POST', body });
    Object.assign(req.headers, headers);
    const res = makeRes();
    await handler(req, res);
    return res;
  };

  try {
    const req = makeReq({ url: '/api/browser-fetch', method: 'POST', body: { url: 'https://example.com' } });
    delete req.headers.referer;
    const res = makeRes();
    await handler(req, res);
    assert(res.statusCode === 403, `expected 403, got ${res.statusCode}`);
    results.push({ name: 'B1 browser-fetch rejects unauthenticated requests', pass: true });
  } catch (err) {
    results.push({ name: 'B1 browser-fetch rejects unauthenticated requests', pass: false, error: err.message });
  }

  try {
    const res = await post({ url: GOV('www.basic.gov.au', '/sitemap.xml'), type: 'sitemap' });
    assert(res.statusCode === 200, `http ${res.statusCode}`);
    assert(res.payload.success === true, `not success: ${res.payload?.error}`);
    assert((res.payload.content || '').includes('urlset'), 'no urlset in browser-fetched content');
    results.push({ name: 'B2 browser-fetch renders gov sitemap via real Chromium', pass: true });
  } catch (err) {
    results.push({ name: 'B2 browser-fetch renders gov sitemap via real Chromium', pass: false, error: err.message });
  }

  return results;
}
