# Skeleton Shell Loading Experience

## Problem

The current loading experience uses a blocking modal overlay with a progress bar. Users stare at a spinner while sitemaps are fetched and parsed, with no view of the destination they're heading to. This feels slow and disconnected.

## Solution

Replace the modal with an inline skeleton shell. On submit, immediately transition to visualization mode and render the full layout — header, stats, view switcher, tree area — with shimmer placeholders. A thin progress bar in the header shows fetch progress. When data arrives, each section cross-fades from skeleton to real content.

## Approach: Inline Skeleton (no new dependencies)

Skeleton shell with CSS cross-fade transitions, thin header progress bar, pure CSS shimmer animation. No Framer Motion or other libraries.

## Loading Timeline

```
T=0ms    User clicks submit
         → Visualization mode activates immediately
         → Header with domain name + thin progress bar at 0%
         → Stats: <StatsSkeleton />
         → View switcher: interactive (Explorer selected)
         → Tree: <TreeSkeleton />
         → Insights: <InsightsSkeleton />

T=200ms  Fetch begins → progress bar 10%, status "Connecting..."
T=500ms  XML received → progress bar 30%, status "Found 4 sitemaps"
T=1-3s   Nested sitemaps → progress bar 30-80%, URL count ticks up
T=3s     Complete → progress bar 100%, fades out after 500ms
         → Skeletons cross-fade to real content (300ms transition)
```

## Components

### Skeleton primitive
- Rounded rectangle, bg-gray-200, CSS shimmer (linear-gradient, 1.5s loop)
- Props: width, height, className
- Pure CSS @keyframes, no JS animation

### StatsSkeleton
- 3-4 cards matching SitemapStats layout
- Shimmer bars for icon, number, label, description

### TreeSkeleton
- 8-10 rows mimicking explorer tree with varied indentation and widths
- Simulates root + children + nested children

### InsightsSkeleton
- Health score card placeholder + content distribution bars

### Header progress bar
- 3px tall, bg-primary-pink, above header border
- Fades out 500ms after 100%
- Status text below domain: "Fetching nested sitemaps... (137 URLs found)"

## Transition Mechanics

- Skeleton: opacity 1 by default
- On data arrival: skeleton fades out (opacity 0, 300ms)
- Real content fades in (opacity 0→1, translateY 8px→0, 300ms)
- No layout shift — skeleton and content share the same container

## Error Handling

- Skeleton fades out, error card appears inline (not modal)
- Progress bar turns red briefly then fades
- "Try Another Website" button available inline

## What Changes

### Removed
- ProgressBar modal overlay (fixed inset-0 z-50)
- 1.5s artificial completion delay
- isLoading gate preventing visualization rendering

### Added
- Skeleton primitive component
- StatsSkeleton, TreeSkeleton, InsightsSkeleton wrappers
- Thin progress bar in visualization header
- Status text in header during fetch
- CSS shimmer animation

### Unchanged
- Fetch logic in handleFetchSitemap
- Crawler path (already progressive)
- All three view types
- Data flow and parsing
