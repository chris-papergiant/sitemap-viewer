# Sitemap Tracker — Evolution Plan

**Date:** 2026-02-20
**Status:** Draft

---

## Vision

Transform sitemap-viewer from a point-in-time visualization tool into an **API-first sitemap tracking service**. Users (human or machine) subscribe to sites, snapshots are captured over time, and diffs reveal how a site's structure evolves. The API is the product; the web UI and a future CLI are both consumers of it.

---

## Architecture Shift

### Current

```
Browser → CORS proxies / Vercel serverless → sitemap XML → in-memory tree → views
```

### Proposed

```
                        ┌─────────────┐
  CLI ──────────────┐   │             │
                    ├──▶│  REST API   │──▶  Storage (Vercel KV)
  Web UI ───────────┤   │  /api/v1/*  │
                    │   │             │
  Agents / webhooks─┘   └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │  Cron jobs  │
                        │  (Vercel)   │
                        └─────────────┘
```

The API layer becomes the single source of truth. The existing frontend becomes a client that calls the same endpoints any CLI or agent would.

---

## API Design (v1)

All endpoints under `/api/v1/`. JSON request/response. Auth via API key (header `X-API-Key`).

### Subscriptions

```
POST   /api/v1/subscriptions          — Subscribe to a site
GET    /api/v1/subscriptions          — List subscriptions
GET    /api/v1/subscriptions/:id      — Get subscription details
DELETE /api/v1/subscriptions/:id      — Unsubscribe
PATCH  /api/v1/subscriptions/:id      — Update frequency / settings
```

**POST body:**
```json
{
  "url": "https://example.com",
  "frequency": "daily",
  "label": "Example site"
}
```

### Snapshots

```
POST   /api/v1/subscriptions/:id/snapshots     — Trigger immediate capture
GET    /api/v1/subscriptions/:id/snapshots      — List snapshots (paginated)
GET    /api/v1/snapshots/:id                    — Get full snapshot (URL list + metadata)
DELETE /api/v1/snapshots/:id                    — Delete a snapshot
```

**Snapshot response:**
```json
{
  "id": "snap_abc123",
  "subscriptionId": "sub_xyz",
  "capturedAt": "2026-02-20T14:30:00Z",
  "urlCount": 1247,
  "fingerprint": "sha256:abcdef...",
  "urls": [
    { "loc": "https://example.com/about", "lastmod": "2026-02-19", "priority": 0.8 }
  ]
}
```

### Diffs

```
GET /api/v1/diff?from=<snapshot_id>&to=<snapshot_id>
```

**Diff response:**
```json
{
  "from": "snap_abc",
  "to": "snap_def",
  "summary": { "added": 16, "removed": 3, "modified": 8, "unchanged": 1220 },
  "changes": [
    { "loc": "https://example.com/new-page", "status": "added" },
    { "loc": "https://example.com/old-page", "status": "removed" },
    { "loc": "https://example.com/updated",  "status": "modified", "fields": ["lastmod", "priority"] }
  ]
}
```

### One-shot (no subscription required)

```
POST /api/v1/fetch    — Fetch & parse a sitemap now (existing functionality, formalized)
POST /api/v1/crawl    — Trigger a crawl (existing progressive crawler, formalized)
```

These preserve the current "paste a URL, see the tree" workflow but as proper API endpoints.

---

## Data Model

### Storage: Vercel KV (Redis)

Lightweight, serverless-native, no connection pooling headaches. Keys:

```
sub:{id}                → Subscription JSON
sub:{id}:snaps          → Sorted set of snapshot IDs by timestamp
snap:{id}               → Snapshot JSON (metadata only)
snap:{id}:urls          → Snapshot URL list (potentially compressed)
apikey:{key}            → User/account ID
```

Snapshots with large URL lists (10K+) may need chunking or a blob store fallback (Vercel Blob). Start with KV and add that escape hatch when needed.

### Key Types

```typescript
interface Subscription {
  id: string;                          // sub_<nanoid>
  url: string;                         // site root URL
  sitemapUrl: string | null;           // resolved sitemap location
  label: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly" | "manual";
  createdAt: string;                   // ISO 8601
  lastCheckedAt: string | null;
  lastSnapshotId: string | null;
  lastChangeAt: string | null;
  status: "active" | "paused" | "error";
  errorMessage: string | null;
}

interface Snapshot {
  id: string;                          // snap_<nanoid>
  subscriptionId: string;
  capturedAt: string;
  urlCount: number;
  fingerprint: string;                 // SHA-256 of sorted loc values
  sitemapUrls: string[];               // which sitemap files were found
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

interface DiffResult {
  fromSnapshotId: string;
  toSnapshotId: string;
  summary: { added: number; removed: number; modified: number; unchanged: number };
  changes: DiffEntry[];
}

interface DiffEntry {
  loc: string;
  status: "added" | "removed" | "modified";
  fields?: string[];                   // which metadata fields changed
  before?: Partial<SitemapEntry>;
  after?: Partial<SitemapEntry>;
}
```

---

## Scheduling

Vercel Cron Jobs defined in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/v1/cron/check-subscriptions", "schedule": "0 * * * *" }
  ]
}
```

The cron handler:
1. Lists all active subscriptions due for a check
2. For each: fetch sitemap, compute fingerprint
3. If fingerprint differs from last snapshot → store new snapshot
4. If fingerprint matches → update `lastCheckedAt`, skip snapshot
5. Optionally fire a webhook if the subscription has one configured

---

## CLI

A thin CLI (`npx sitemap-tracker` or standalone binary) that wraps the API:

```bash
# Subscribe
sitemap-tracker subscribe https://example.com --frequency daily

# List subscriptions
sitemap-tracker list

# Check now
sitemap-tracker check https://example.com

# View latest snapshot
sitemap-tracker snapshot https://example.com --latest

# Diff
sitemap-tracker diff https://example.com --last 2

# One-shot fetch (no subscription)
sitemap-tracker fetch https://example.com

# Output formats
sitemap-tracker diff https://example.com --last 2 --format json
sitemap-tracker diff https://example.com --last 2 --format tree
sitemap-tracker diff https://example.com --last 2 --format csv
```

The CLI stores the API key in `~/.sitemap-tracker/config.json` and defaults to the hosted API URL. Could be pointed at a self-hosted instance.

**Agent-friendly features:**
- All commands accept `--json` for structured output
- Exit codes: 0 = success, 1 = error, 2 = changes detected (useful in CI/CD)
- Stdin support: pipe a list of URLs to batch-subscribe
- Webhook registration via CLI for event-driven workflows

---

## Web UI Changes

The existing frontend adapts to become an API client:

### New Pages / Views

1. **Dashboard** — List of subscribed sites, last-checked status, change indicators
2. **Timeline** — For a subscription, show snapshot history with sparkline of URL count
3. **Diff view** — Compare two snapshots with the existing tree views, color-coded:
   - Green: added nodes
   - Red: removed nodes (rendered as ghost/faded)
   - Amber: modified metadata
4. **API key management** — Generate/revoke keys

### Changes to Existing Views

- `TreeNode` gains `diffStatus?: "added" | "removed" | "modified" | "unchanged"`
- `buildTreeFromUrls` gets a `buildDiffTree(before, after)` variant
- Explorer, Columns, and Graph views read `diffStatus` for styling (a few lines each)
- The current "paste URL and view" flow remains as-is but calls `/api/v1/fetch` behind the scenes

---

## Implementation Phases

### Phase 1 — API Foundation

Extract existing fetch/parse logic into shared utilities. Stand up the core API endpoints as Vercel serverless functions. Wire up Vercel KV for subscription and snapshot storage.

**Delivers:** Working API for subscribe, snapshot, and diff. Testable via curl/Postman.

### Phase 2 — Web UI Integration

Connect the frontend to the new API. Add dashboard, timeline, and diff overlay to existing views. Implement API key flow (can be simple — single-user / env-var key to start).

**Delivers:** End-to-end tracking workflow in the browser.

### Phase 3 — Scheduling

Add Vercel Cron job for automated checks. Implement fingerprint-based change detection to avoid redundant snapshots. Add webhook support for change notifications.

**Delivers:** Hands-off tracking. Subscribe once, get notified when things change.

### Phase 4 — CLI

Build the CLI package. Publish to npm. Support all API operations with `--json` output for agent consumption.

**Delivers:** `npx sitemap-tracker subscribe https://example.com --frequency daily`

### Phase 5 — Scale & Polish

- Snapshot compression / blob storage for large sitemaps
- Rate limiting and usage tiers
- Batch operations (subscribe to many sites at once)
- RSS/Atom feed of changes per subscription
- GitHub Action for "fail CI if sitemap changed unexpectedly"

---

## Open Questions

1. **Auth model** — API keys are simple but single-tenant. Do we need multi-user accounts eventually, or is this a personal/team tool?
2. **Snapshot retention** — How long to keep snapshots? Storage cost scales linearly. Default 90 days with configurable retention?
3. **Large sitemaps** — Vercel KV values max out at 1MB. A 50K-URL sitemap may exceed that. Vercel Blob (S3-compatible) is the fallback — when do we introduce it?
4. **Webhook format** — What payload do consumers expect? Start with a simple POST containing the diff summary and iterate?
5. **Rate limiting** — How many subscriptions / snapshots per API key? Free tier vs. paid?
