import type { VercelRequest, VercelResponse } from '@vercel/node';

// Shared request guards for the fetch-proxy and browser-fetch endpoints.
// These endpoints fetch arbitrary URLs on behalf of the frontend, so left
// open they'd be a free proxy for anyone. Two layers of protection:
//
// 1. Same-origin check: browser requests carry Origin (POST/cross-origin)
//    or Referer (same-origin GET) headers. We require one of them to be
//    present and to match the host serving the API. Non-browser clients
//    (curl, scripts) send neither and are rejected.
// 2. Per-IP rate limit: in-memory sliding window. Serverless instances
//    don't share memory, so this is best-effort per warm instance — enough
//    to blunt abuse without external infrastructure.

const requestLog = new Map<string, number[]>();
const WINDOW_MS = 60_000;

const getClientIp = (req: VercelRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
};

const getHeaderHost = (value: string | string[] | undefined): string | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
};

/**
 * Verify the request came from a browser page served by this deployment.
 * Returns null when allowed, or an error message when it should be rejected.
 */
export const checkSameOrigin = (req: VercelRequest): string | null => {
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const selfHost = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader)
    ?.toLowerCase();
  if (!selfHost) {
    return 'Unable to determine request host';
  }

  const originHost = getHeaderHost(req.headers.origin);
  const refererHost = getHeaderHost(req.headers.referer);

  if (!originHost && !refererHost) {
    return 'Missing Origin/Referer header — this API only serves the app frontend';
  }
  if (originHost && originHost !== selfHost) {
    return 'Cross-origin requests are not allowed';
  }
  if (!originHost && refererHost && refererHost !== selfHost) {
    return 'Cross-origin requests are not allowed';
  }
  return null;
};

/**
 * Sliding-window rate limit per client IP. Returns true when the request
 * is within budget.
 */
export const checkRateLimit = (req: VercelRequest, maxPerMinute: number): boolean => {
  const ip = getClientIp(req);
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= maxPerMinute) {
    requestLog.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);

  // Opportunistic cleanup so the map doesn't grow unbounded
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every(t => now - t >= WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }
  return true;
};

/**
 * Apply both guards; sends the error response and returns false if the
 * request should not proceed.
 */
export const guardRequest = (
  req: VercelRequest,
  res: VercelResponse,
  maxPerMinute: number
): boolean => {
  const originError = checkSameOrigin(req);
  if (originError) {
    res.status(403).json({ success: false, error: originError });
    return false;
  }
  if (!checkRateLimit(req, maxPerMinute)) {
    res.status(429).json({ success: false, error: 'Rate limit exceeded — try again in a minute' });
    return false;
  }
  return true;
};
