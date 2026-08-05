// LIVE mode: run the real fetch-proxy (and browser-fetch fallback) against
// real Australian government domains. Requires unrestricted outbound network
// access — run from a normal dev machine (LIVE=1 npm run test:gov), not a
// sandbox.
//
// Outcomes are classified honestly, because "works" is not binary for gov
// sites:
//   PASS     server-side proxy retrieved usable content (200, non-empty)
//   SKIP     transient/environment failure (5xx, connection reset, timeout,
//            DNS) — not attributable to our code
//   BLOCKED  site actively refuses automated access server-side (persistent
//            4xx / bot-wall). The app handles this by design: it degrades to
//            the crawler (proven by mock scenario E4). Informational, and
//            re-checked via the browser-fetch tier before being recorded.
//
// The suite fails ONLY on a genuine code mishandling: a reachable 200 whose
// body our validator wrongly rejects, or a handler exception. If every
// domain is unreachable, the whole phase SKIPs like the no-network case.

import { join } from 'node:path';

export const LIVE_DOMAINS = [
  'https://www.health.gov.au',
  'https://www.servicesaustralia.gov.au',
  'https://www.ato.gov.au',
  'https://www.vic.gov.au',
  'https://www.nsw.gov.au',
  'https://www.vichealth.vic.gov.au',
];

const makeReq = (targetUrl) => {
  const params = new URLSearchParams({ url: targetUrl });
  return {
    method: 'GET',
    url: `/api/fetch-proxy?${params}`,
    headers: { host: 'localhost:8090', referer: 'http://localhost:8090/' },
    query: Object.fromEntries(params),
    socket: { remoteAddress: '127.0.0.1' },
  };
};

const makePost = (targetUrl) => ({
  method: 'POST',
  url: '/api/browser-fetch',
  headers: { host: 'localhost:8090', origin: 'http://localhost:8090' },
  body: { url: targetUrl, type: 'sitemap' },
  socket: { remoteAddress: '127.0.0.1' },
});

const makeRes = () => {
  const res = { statusCode: 200, payload: undefined };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.payload = obj; return res; };
  return res;
};

// Does this text look like a transient/network problem rather than the site
// itself answering?
const isTransient = (status, errorText) => {
  if (status && status >= 500) return true;
  const t = (errorText || '').toLowerCase();
  return /reset|econnrefused|timed out|timeout|enotfound|network|socket hang up|upstream connect/.test(t);
};

const looksBlocked = (status, body) => {
  if (status === 403 || status === 401 || status === 429) return true;
  const b = (body || '').toLowerCase();
  return /access denied|are you a robot|just a moment|attention required|request unauthorized/.test(b);
};

const looksUsable = (contentType, body) => {
  const text = body || '';
  if (text.includes('<urlset') || text.includes('<sitemapindex') || text.includes('<?xml')) return true;
  if (/sitemap:/i.test(text)) return true; // robots.txt with a Sitemap directive
  return (contentType || '').includes('text/plain') && text.trim().length > 0;
};

export async function runLiveTests({ apiBuildDir }) {
  const { default: fetchProxy } = await import(join(apiBuildDir, 'fetch-proxy.js'));
  let browserFetch = null;
  try {
    ({ default: browserFetch } = await import(join(apiBuildDir, 'browser-fetch.js')));
  } catch { /* browser tier optional */ }

  const results = [];

  // Connectivity probe against a highly-available host
  try {
    const probe = makeRes();
    await fetchProxy(makeReq('https://www.google.com/robots.txt'), probe);
    if (!probe.payload?.success || isTransient(probe.payload?.status, probe.payload?.error)) {
      return { skipped: true, reason: `no usable outbound network (probe status ${probe.payload?.status}, ${probe.payload?.error || 'ok'})`, results };
    }
  } catch (err) {
    return { skipped: true, reason: `no outbound network (${err.message})`, results };
  }

  const callProxy = async (target) => {
    const res = makeRes();
    await fetchProxy(makeReq(target), res);
    return res.payload;
  };

  let reachableCount = 0;

  for (const domain of LIVE_DOMAINS) {
    const host = new URL(domain).hostname;
    const candidates = [`${domain}/robots.txt`, `${domain}/sitemap.xml`];

    let verdict = null; // {kind, detail}
    for (const target of candidates) {
      let p;
      try {
        p = await callProxy(target);
      } catch (err) {
        verdict = { kind: 'FAIL', detail: `handler threw: ${err.message}` };
        break;
      }

      if (!p.success || p.status >= 400) {
        const status = p.status;
        if (isTransient(status, p.error)) { verdict = { kind: 'SKIP', detail: `${target} transient (${status || p.error})` }; continue; }
        if (looksBlocked(status, p.content)) { verdict = { kind: 'BLOCKED', detail: `${target} HTTP ${status}` }; continue; }
        verdict = { kind: 'SKIP', detail: `${target} HTTP ${status || p.error}` };
        continue;
      }

      // 200-level response — the code must produce usable content from it
      if (looksUsable(p.contentType, p.content)) {
        verdict = { kind: 'PASS', detail: `${target} (${p.content.length} bytes${p.redirected ? ', redirected' : ''})` };
        reachableCount++;
        break;
      }
      verdict = { kind: 'FAIL', detail: `${target} returned 200 but content unusable (ct=${p.contentType}, ${p.content.length} bytes)` };
      break;
    }

    // For BLOCKED sites, give the browser-fetch tier a chance — that's the
    // app's actual next step for bot-walled gov sites.
    if (verdict?.kind === 'BLOCKED' && browserFetch) {
      try {
        const res = makeRes();
        await browserFetch(makePost(`${domain}/robots.txt`), res);
        const bp = res.payload;
        if (bp?.success && looksUsable(undefined, bp.content) && !looksBlocked(bp.status, bp.content)) {
          verdict = { kind: 'PASS', detail: `via browser-fetch (${(bp.content || '').length} bytes)` };
          reachableCount++;
        } else {
          verdict.detail += '; browser-fetch also blocked → app degrades to crawler';
        }
      } catch (err) {
        if (isTransient(null, err.message)) verdict.detail += `; browser-fetch transient (${err.message.split('\n')[0]})`;
        else verdict.detail += '; browser-fetch failed → app degrades to crawler';
      }
    }

    // BLOCKED and SKIP are not code failures; only FAIL counts against us
    results.push({
      name: `LIVE ${host}`,
      pass: verdict.kind === 'PASS' || verdict.kind === 'BLOCKED' || verdict.kind === 'SKIP',
      kind: verdict.kind,
      detail: `${verdict.kind}: ${verdict.detail}`,
    });
  }

  // If nothing was reachable and nothing hard-blocked, treat as environment skip
  const anyMeaningful = results.some(r => r.kind === 'PASS' || r.kind === 'BLOCKED' || r.kind === 'FAIL');
  if (!anyMeaningful) {
    return { skipped: true, reason: 'all live domains unreachable (transient/network)', results };
  }

  return { skipped: false, reachableCount, results };
}
