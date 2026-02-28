# JTBD Canvas — Sitemap Viewer
*Generated: 2026-02-28*

## User Types

| Type | Description | Primary Context |
|------|-------------|-----------------|
| SEO Professional | Audits site structure, analyzes competitors, advises clients on search optimization | Exploring unfamiliar sites quickly, building competitive intelligence |
| Web Developer / QA | Builds and tests websites, verifies page coverage and URL structure | Project handoffs, post-deployment checks, sitemap maintenance |
| Content Strategist / UX Designer | Plans information architecture, audits content, communicates structure to stakeholders | Site restructures, content audits, stakeholder alignment |
| Website Owner / Manager | Non-technical person responsible for a site's presence and health | Answering "how big is our site?", checking site health without dev help |

## Job Statements

### SEO Professional

#### Jobs Served Today

| # | Job Statement | Type | Fulfillment | Mapped Features |
|---|---------------|------|-------------|-----------------|
| 1 | **When** I come across an unfamiliar competitor site, **I want to** quickly map its structure and content areas, **so I can** spot opportunities and plan my content strategy against it | Functional | Partially served | Sitemap fetch + crawler + 3 views; limited to 500 pages / 3 depth |
| 2 | **When** I'm exploring a new site, **I want to** get a structural overview without installing tools or running a full crawl, **so I can** move fast and stay in flow | Functional | Fully served | Browser-based SPA, no install, URL input and go |
| 3 | **When** I'm reviewing a site's architecture, **I want to** find structural issues like deep nesting or orphaned sections, **so I can** surface actionable recommendations | Functional | Well served | Health score, issue detection (deep nesting, thin sections, imbalance, stale content, missing metadata), content distribution chart |

#### Jobs to Serve

| # | Job Statement | Type | Priority | Notes |
|---|---------------|------|----------|-------|
| 4 | **When** I'm presenting to a client, **I want to** show a visual representation of their site structure, **so I can** make my findings tangible and persuasive | Social | High | SVG/PNG export from graph, JSON export, shareable URLs with search state |

### Web Developer / QA

#### Jobs Served Today

| # | Job Statement | Type | Fulfillment | Mapped Features |
|---|---------------|------|-------------|-----------------|
| 5 | **When** I'm working on a website, **I want to** verify all expected pages exist and are reachable, **so I can** catch coverage gaps before users or search engines do | Functional | Well served | URL verification spot-checks accessibility, structural analysis flags issues |
| 6 | **When** I inherit or join a project, **I want to** quickly understand the site's URL structure, **so I can** orient myself without reading all the code | Functional | Fully served | Explorer/Columns/Graph views show hierarchy clearly |

#### Jobs to Serve

| # | Job Statement | Type | Priority | Notes |
|---|---------------|------|----------|-------|
| 7 | **When** I've deployed changes, **I want to** confirm the sitemap is accurate and pages are accessible, **so I can** be confident nothing broke | Emotional | Medium | No diff/comparison between crawl results and sitemap |

### Content Strategist / UX Designer

#### Jobs Served Today

| # | Job Statement | Type | Fulfillment | Mapped Features |
|---|---------------|------|-------------|-----------------|
| 8 | **When** I'm planning a site restructure, **I want to** see the current information architecture visually, **so I can** identify what to reorganize and communicate changes to stakeholders | Functional | Fully served | Three visualization modes cover this well |
| 9 | **When** I'm auditing content, **I want to** see page counts and hierarchy by section, **so I can** understand where content is concentrated or thin | Functional | Well served | Content Distribution chart shows per-section page counts with bar visualization |

#### Jobs to Serve

| # | Job Statement | Type | Priority | Notes |
|---|---------------|------|----------|-------|
| 10 | **When** I need to explain site structure to non-technical stakeholders, **I want to** show an interactive visual, **so I can** get alignment without jargon | Social | High | Contextual descriptions on all views, shareable URLs with search state |

### Website Owner / Manager

#### Jobs Served Today

| # | Job Statement | Type | Fulfillment | Mapped Features |
|---|---------------|------|-------------|-----------------|
| 11 | **When** someone asks "how big is our website?", **I want to** get a page count and structural overview instantly, **so I can** answer confidently without bothering my dev team | Emotional | Fully served | Stats + tree view answer this fast |
| 12 | **When** I'm evaluating my website's health, **I want to** see if pages are being updated and none are missing, **so I can** feel in control of my digital presence | Emotional | Well served | Stale content detection, health score, URL verification |

## Opportunity Map

| # | Job | User Type | Importance | Fulfillment | Opportunity |
|---|-----|-----------|------------|-------------|-------------|
| 4 | Present site structure to clients | SEO | 5 | 3 | **2** |
| 3 | Find structural issues in architecture | SEO | 5 | 4 | **1** |
| 10 | Show interactive visuals to non-tech stakeholders | Content/UX | 4 | 3 | **1** |
| 9 | See page counts by section | Content/UX | 4 | 4 | **0** |
| 1 | Map unfamiliar competitor site structure | SEO | 5 | 4 | **1** |
| 7 | Confirm sitemap accuracy post-deploy | Dev/QA | 3 | 3 | **0** |
| 5 | Verify all pages exist and are reachable | Dev/QA | 4 | 4 | **0** |
| 12 | Check if pages are updated / none missing | Owner | 3 | 3 | **0** |
| 2 | Quick structural overview, no install | SEO | 5 | 5 | **0** |
| 6 | Understand URL structure on new project | Dev/QA | 4 | 4 | **0** |
| 8 | See current IA visually for restructure planning | Content/UX | 4 | 4 | **0** |
| 11 | Get page count and overview instantly | Owner | 3 | 4 | **-1** |

## Switch Forces

### Present site structure to clients (Opportunity: 4)

| Force | Direction | Description |
|-------|-----------|-------------|
| Push | Drives adoption | Screenshots of dev tools or spreadsheet exports look unprofessional in client decks. Screaming Frog output requires cleanup before sharing. |
| Pull | Drives adoption | Interactive visual views (graph, explorer) are inherently more impressive than static exports. Zero-install means you can demo live in a meeting. |
| Anxiety | Resists adoption | "Will the fetch work live in a client call?" — CORS failures or slow crawls during a presentation would be embarrassing. No way to save/cache results. |
| Habit | Resists adoption | Already using screenshots + PowerPoint. Screaming Frog exports are "good enough" even if ugly. Clients expect spreadsheets, not interactive tools. |

### Find structural issues in site architecture (Opportunity: 3)

| Force | Direction | Description |
|-------|-----------|-------------|
| Push | Drives adoption | Full SEO tools require expensive licenses and lengthy crawls. Quick structural checks shouldn't need a $200/yr tool. Manual review of sitemap XML is tedious and error-prone. |
| Pull | Drives adoption | Visual hierarchy makes deep nesting and imbalanced sections immediately obvious. Speed of getting from URL to insight is unmatched. |
| Anxiety | Resists adoption | "Is 500 pages enough to find real issues?" — crawl limits may miss important sections. No explicit issue flagging means you have to spot problems yourself. |
| Habit | Resists adoption | Screaming Frog / Ahrefs already flag issues automatically. Teams have existing audit workflows built around these tools. |

### Show interactive visuals to non-technical stakeholders (Opportunity: 3)

| Force | Direction | Description |
|-------|-----------|-------------|
| Push | Drives adoption | Explaining site structure verbally or via spreadsheets loses stakeholders. IA diagrams in Miro/Figma require manual creation and go stale. |
| Pull | Drives adoption | Graph and columns views are intuitive — stakeholders can click and explore themselves. Live data means it's always current. |
| Anxiety | Resists adoption | "Will non-technical people understand this interface?" — the tool was built for technical users, not executives. No onboarding or guided tour. |
| Habit | Resists adoption | Teams already create IA diagrams manually in Figma/Miro. These are curated and annotated — auto-generated views feel less polished. |

### See page counts and hierarchy by section (Opportunity: 2)

| Force | Direction | Description |
|-------|-----------|-------------|
| Push | Drives adoption | Getting section-level content volume currently requires manual counting or custom queries. Content audits start with "how much content do we have where?" |
| Pull | Drives adoption | Visual tree structure naturally groups content by section. Explorer view shows hierarchy at a glance. |
| Anxiety | Resists adoption | "Are these numbers accurate?" — crawler limits and sitemap completeness could give misleading counts. No way to validate against CMS data. |
| Habit | Resists adoption | Content teams use CMS reports or Google Analytics for page counts. These feel more authoritative since they come from the source system. |
