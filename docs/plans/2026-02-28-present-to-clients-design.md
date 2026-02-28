# Feature #4: Present Site Structure to Clients

## Job Statement
**When** I'm presenting to a client, **I want to** show a visual representation of their site structure, **so I can** make my findings tangible and persuasive.

## Approach: Export-Focused

### Components

#### 1. SVG Export (Graph View)
- Add "Export SVG" button to GraphView toolbar next to zoom controls
- Serialize `svgRef.current.outerHTML` with inlined styles
- Clean SVG: remove tooltips, zoom handlers, add white background
- Download as `{domain}_sitemap_graph.svg`

#### 2. PNG Export (Graph View)
- Render exported SVG to canvas via `Image` element
- Export canvas as PNG with `toDataURL('image/png')`
- Download as `{domain}_sitemap_graph.png`
- Use 2x scale for high-DPI output

#### 3. JSON Export
- Add "Download JSON" alongside existing CSV button in the toolbar
- Serialize `treeData` with metadata: domain, timestamp, URL count, source
- Download as `{domain}_sitemap_{date}.json`

#### 4. Enhanced Shareable URLs
- Add `search` query parameter to URL state
- Add "Copy Link" button in the toolbar
- Show brief confirmation when copied

### Files to Modify
- `src/components/views/GraphView.tsx` — SVG/PNG export buttons and logic
- `src/utils/exportUtils.ts` — New file for SVG→PNG conversion, JSON export
- `src/App.tsx` — search param persistence, copy link button, JSON export trigger
- `src/components/ViewSwitcher.tsx` — add export buttons to toolbar

### Implementation Steps

1. **Create exportUtils.ts** — SVG cleanup, SVG→PNG conversion, JSON serializer
2. **Update GraphView.tsx** — Add export buttons, wire to exportUtils
3. **Update App.tsx** — Persist search in URL params, add JSON export + copy link
4. **Update ViewSwitcher.tsx** — Add export/share buttons to toolbar
5. **E2E test** — Verify exports work, shareable URLs load correctly
