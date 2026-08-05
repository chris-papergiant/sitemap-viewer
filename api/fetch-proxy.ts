import type { VercelRequest, VercelResponse } from '@vercel/node';

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
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB

// Reject requests targeting internal/private hosts (SSRF protection)
const isPrivateHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  // IPv6 loopback / link-local / unique-local
  if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
    return true;
  }
  // IPv4 private and special-use ranges
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.method === 'POST' ? req.body?.url : req.query.url;
  const headOnly =
    req.method === 'POST' ? req.body?.head === true : req.query.head === '1';

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ success: false, error: 'Only http/https URLs are allowed' });
  }

  if (isPrivateHost(parsed.hostname)) {
    return res.status(400).json({ success: false, error: 'Requests to private hosts are not allowed' });
  }

  console.log(`[Fetch Proxy] ${headOnly ? 'HEAD' : 'GET'} ${url}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let response = await fetch(url, {
      method: headOnly ? 'HEAD' : 'GET',
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });

    // Some servers reject HEAD — retry as GET and discard the body
    if (headOnly && (response.status === 405 || response.status === 501)) {
      response = await fetch(url, {
        method: 'GET',
        headers: BROWSER_HEADERS,
        redirect: 'follow',
        signal: controller.signal,
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
          error: `Content too large (${declaredLength} bytes)`,
          url: response.url,
        });
      }
      content = await response.text();
      if (content.length > MAX_CONTENT_LENGTH) {
        return res.status(200).json({
          success: false,
          status: response.status,
          error: 'Content too large',
          url: response.url,
        });
      }
    }

    console.log(`[Fetch Proxy] ${response.status} from ${response.url} (${content.length} bytes)`);

    // success means the request completed; callers inspect `status` for HTTP errors
    return res.status(200).json({
      success: true,
      status: response.status,
      content,
      contentType,
      url: response.url,
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
    responseLimit: '12mb',
  },
  maxDuration: 30,
};
