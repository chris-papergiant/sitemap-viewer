# Government-website test harness

Verifies that the app successfully processes government websites — the sites
whose behavior broke earlier versions (see `../../VICHEALTH_FINAL_ANALYSIS.md`
and `../../CORS_BYPASS_IMPLEMENTATION.md`).

```bash
npm run test:gov            # mock mode (deterministic, no internet needed)
LIVE=1 npm run test:gov     # also hit real gov.au domains (needs internet)
```

## Why this harness exists

Government sites (`.gov.au` especially) do three things that ordinary test
setups miss:

1. **Block the public CORS proxies** the frontend normally uses.
2. **Bot-filter by request shape** — a plain fetch gets a 403, a browser-like
   request succeeds.
3. **Only respond to the app's own serverless proxy** (`/api/fetch-proxy`,
   `/api/browser-fetch`).

Crucially, `vite preview` **404s the `/api/*` routes**, so earlier UI tests
never executed the serverless code that makes gov sites work. This harness
runs that **real handler code** (compiled from `api/*.ts` by esbuild) behind a
Vercel-compatible adapter, against a local origin that reproduces the gov
behaviors above.

## What runs

**`fetch-proxy` handler tests** (`unit-tests.mjs`) — the real handler with
fake req/res:
- U1–U2 same-origin guard (missing / cross-origin Origin·Referer → 403)
- U3 literal private-host SSRF block (127.0.0.1, 10.x, 169.254.x, ::1, localhost)
- U4 DNS-resolved private-host block (hostname → private IP)
- U5 gov sitemap fetched once browser headers pass the bot filter
- U6 redirect hop to a private address is blocked
- U7 same-origin redirect followed, `initialStatus` reported (so the verifier
  can still tell a redirect from a 200)
- U8 HEAD → GET fallback on 405
- U9 oversized body rejected before the Vercel 4.5 MB response cap
- U10 per-IP rate limit
- U11 Cloudflare bot-wall (403 + interstitial) flagged via `botWall`

**`browser-fetch` handler tests** — real headless Chromium:
- B1 rejects unauthenticated requests
- B2 renders a gov sitemap end-to-end

**E2E scenarios** (`e2e-tests.mjs`) — Playwright drives the production build
served by `app-server.mjs`, with **every public CORS proxy blocked at the
network layer** (what real gov sites do), so only the server-side path can
pass:
- E1 robots.txt with a dead + a live `Sitemap:` entry → 60 URLs
- E2 Drupal-style paginated sitemap index → 75 URLs across 3 children
- E3 redirecting `/sitemap.xml` (301) followed with per-hop validation
- E4 no sitemap anywhere → automatic crawler fallback through the server proxy
- E5 URL verification via server-side HEAD checks
- E6 Cloudflare-walled site (like vichealth.vic.gov.au) → fails fast (<25 s,
  no doomed crawl) with a specific, honest message naming the firewall

### The bot-wall case (Cloudflare / Akamai)

Some gov sites (e.g. `vichealth.vic.gov.au`) sit behind a bot-management
firewall that returns HTTP 403 to **every datacenter-hosted request** — the
public CORS proxies, our serverless proxy, and the headless-browser tier
alike — because the block is keyed on IP reputation, not request shape. No
proxy or header trick bypasses it; only a residential IP (a real user's own
browser) gets through, and CORS then blocks that for cross-origin XML.

Because this is genuinely unfetchable server-side, the app does the honest
thing: `fetch-proxy` detects the interstitial and returns a `botWall` vendor
label, the client raises `BotWallError`, and the fetch **short-circuits** —
no grinding through 12 sitemap locations and then a doomed crawl. The user
gets a clear, specific message in ~200 ms instead of a vague failure after
minutes. Scenario E6 asserts all of that; the `www.walled.gov.au` mock host
reproduces the exact Cloudflare block.

**Live domains** (`live-tests.mjs`, `LIVE=1` only) — real `.gov.au` sites,
classified honestly:
- `PASS` retrieved server-side (200, usable body)
- `SKIP` transient/environment failure (5xx, reset, timeout, DNS)
- `BLOCKED` site refuses automation server-side *and* via browser-fetch; the
  app degrades to the crawler by design (proven by E4)

The live phase fails only on a genuine mishandling (a reachable 200 whose body
our validator wrongly rejects, or a handler exception). If nothing is
reachable it skips like the no-network case.

## Requirements

- A Chromium binary — `CHROMIUM_EXECUTABLE_PATH` (default
  `/opt/pw-browsers/chromium`).
- `/etc/hosts` entries mapping the mock hostnames to `127.0.0.1`. Added
  automatically when the harness runs as root; otherwise add manually:
  ```
  127.0.0.1 www.basic.gov.au www.index.gov.au www.redirect.gov.au www.nositemap.gov.au
  ```

## Test-only environment variables

These exist for the harness and **must never be set in production**:

- `FETCH_PROXY_TRUST_HOSTS` — comma-separated hostnames/suffixes that skip the
  private-address SSRF checks, so a mock origin on 127.0.0.1 can stand in for a
  gov site. Leaving it unset keeps the guards fully active (U3/U4 verify that).
- `CHROMIUM_EXECUTABLE_PATH` — use a system Chromium instead of unpacking the
  `@sparticuz/chromium` lambda binary.
- `FETCH_PROXY_RATE_LIMIT` / `BROWSER_FETCH_RATE_LIMIT` — override the per-IP
  limits (U10 sets a low value to assert enforcement).
