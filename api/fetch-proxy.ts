import { lookup } from 'node:dns/promises';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { guardRequest } from './_security';

// Lightweight server-side fetch proxy.
//
// Government sites (.gov.au etc.) actively block the public CORS proxy
// services the frontend uses (corsproxy.io, codetabs, cors.sh...), but they
// respond normally to direct server-side requests with browser-like headers.
// This endpoint is a fast, cheap alternative to the full Playwright fallback
// in /api/browser-fetch — no browser launch, just a plain fetch.

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-AU,en-US;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

const FETCH_TIMEOUT_MS = 20000;
// Vercel serverless functions cap response bodies at ~4.5MB on every plan,
// so anything larger would download fully and then fail at the platform
// layer. Cap below that so we fail fast with a clear error instead.
const MAX_CONTENT_LENGTH = 4 * 1024 * 1024; // 4MB
const MAX_REDIRECTS = 5;
// High enough for the crawler's legitimate traffic on protected sites
// (batches of 3 pages/second routes everything through this endpoint),
// low enough to blunt abuse. Overridable for the test harness.
const DEFAULT_RATE_LIMIT_PER_MINUTE = 240;

const getRateLimit = (): number =>
  parseInt(process.env.FETCH_PROXY_RATE_LIMIT || '', 10) || DEFAULT_RATE_LIMIT_PER_MINUTE;

// Test-harness escape hatch: hostnames (exact or suffix match) that skip the
// private-address checks so a local mock origin can stand in for gov sites.
// NEVER set FETCH_PROXY_TRUST_HOSTS in production.
const isTrustedTestHost = (hostname: string): boolean => {
  const entries = (process.env.FETCH_PROXY_TRUST_HOSTS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return entries.some(e => hostname === e || hostname.endsWith(e));
};

// Reject hostnames/addresses in private or special-use ranges (SSRF protection)
const isPrivateAddress = (addr: string): boolean => {
  const host = addr.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  // IPv6 loopback / link-local / unique-local / unspecified
  if (host === '::' || host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
    return true;
  }
  // IPv4-mapped IPv6 (::ffff:10.0.0.1)
  const mapped = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  const ipv4Host = mapped ? mapped[1] : host;
  const ipv4 = ipv4Host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [parseInt(ipv4[1], 10), parseInt(ipv4[2], 10)];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }
  return false;
};

// Validate a target URL: scheme, literal hostname, and resolved DNS addresses.
// Returns an error string, or null when the URL is safe to fetch.
const validateTarget = async (target: URL): Promise<string | null> => {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return 'Only http/https URLs are allowed';
  }
  if (isTrustedTestHost(target.hostname)) {
    return null;
  }
  if (isPrivateAddress(target.hostname)) {
    return 'Requests to private hosts are not allowed';
  }
  try {
    const addresses = await lookup(target.hostname, { all: true });
    if (addresses.some(a => isPrivateAddress(a.address))) {
      return 'Requests to private hosts are not allowed';
    }
  } catch {
    return `Could not resolve host: ${target.hostname}`;
  }
  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guardRequest(req, res, getRateLimit())) {
    return;
  }

  const url = req.method === 'POST' ? req.body?.url : req.query.url;
  const headOnly =
    req.method === 'POST' ? req.body?.head === true : req.query.head === '1';

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }

  console.log(`[Fetch Proxy] ${headOnly ? 'HEAD' : 'GET'} ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Follow redirects manually so every hop gets SSRF validation, and so we
    // can report the original status (the verifier distinguishes redirects).
    let response: Response | null = null;
    let initialStatus: number | null = null;
    let currentUrl = target;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const targetError = await validateTarget(currentUrl);
      if (targetError) {
        return res.status(400).json({ success: false, error: targetError });
      }

      response = await fetch(currentUrl.href, {
        method: headOnly ? 'HEAD' : 'GET',
        headers: BROWSER_HEADERS,
        redirect: 'manual',
        signal: controller.signal,
      });

      // Some servers reject HEAD — retry this hop as GET and discard the body
      if (headOnly && (response.status === 405 || response.status === 501)) {
        response = await fetch(currentUrl.href, {
          method: 'GET',
          headers: BROWSER_HEADERS,
          redirect: 'manual',
          signal: controller.signal,
        });
      }

      if (initialStatus === null) {
        initialStatus = response.status;
      }

      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel();
        currentUrl = new URL(location, currentUrl);
        continue;
      }
      break;
    }

    if (!response) {
      throw new Error('No response received');
    }
    if (response.status >= 300 && response.status < 400) {
      return res.status(200).json({
        success: false,
        status: response.status,
        initialStatus,
        error: `Too many redirects (more than ${MAX_REDIRECTS})`,
        url: currentUrl.href,
      });
    }

    const contentType = response.headers.get('content-type') || undefined;
    let content = '';

    if (!headOnly) {
      const declaredLength = parseInt(response.headers.get('content-length') || '0', 10);
      if (declaredLength > MAX_CONTENT_LENGTH) {
        return res.status(200).json({
          success: false,
          status: response.status,
          initialStatus,
          error: `Content too large (${declaredLength} bytes, limit ${MAX_CONTENT_LENGTH})`,
          url: currentUrl.href,
        });
      }
      content = await response.text();
      if (content.length > MAX_CONTENT_LENGTH) {
        return res.status(200).json({
          success: false,
          status: response.status,
          initialStatus,
          error: 'Content too large',
          url: currentUrl.href,
        });
      }
    } else {
      await response.body?.cancel();
    }

    console.log(`[Fetch Proxy] ${response.status} from ${currentUrl.href} (${content.length} bytes)`);

    // success means the request completed; callers inspect `status` for HTTP
    // errors and `initialStatus` to detect redirects.
    return res.status(200).json({
      success: true,
      status: response.status,
      initialStatus,
      redirected: currentUrl.href !== target.href,
      content,
      contentType,
      url: currentUrl.href,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const timedOut = error instanceof Error && error.name === 'AbortError';
    console.error(`[Fetch Proxy] Failed for ${url}:`, message);
    return res.status(200).json({
      success: false,
      error: timedOut ? `Request timed out after ${FETCH_TIMEOUT_MS / 1000}s` : message,
      url,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
    responseLimit: '4mb',
  },
  maxDuration: 30,
};
