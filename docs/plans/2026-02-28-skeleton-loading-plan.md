# Skeleton Shell Loading Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the blocking modal loading overlay with an inline skeleton shell that shows the visualization layout immediately, filling in real content as data arrives.

**Architecture:** On submit, immediately enter visualization mode and render the full page layout (header, stats, view switcher, tree) with skeleton placeholders. A thin progress bar in the header shows fetch progress. When data arrives, each section cross-fades from skeleton to real content via CSS transitions. No new dependencies.

**Tech Stack:** React, Tailwind CSS (existing shimmer animation + shimmer-gradient background in tailwind.config.js)

---

### Task 1: Create Skeleton Primitive Component

**Files:**
- Create: `src/components/ui/Skeleton.tsx`

**Step 1: Create the Skeleton primitive**

```tsx
const Skeleton = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-gray-200 rounded-md bg-shimmer-gradient bg-[length:2400px_100%] animate-shimmer ${className}`}
    {...props}
  />
);

export default Skeleton;
```

This leverages the existing `animate-shimmer` animation and `bg-shimmer-gradient` background already defined in `tailwind.config.js:246,331`.

**Step 2: Verify it renders**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ui/Skeleton.tsx
git commit -m "feat: add Skeleton primitive component"
```

---

### Task 2: Create StatsSkeleton Component

**Files:**
- Create: `src/components/skeletons/StatsSkeleton.tsx`

**Step 1: Create StatsSkeleton matching SitemapStats layout**

The real component at `src/components/SitemapStats.tsx:107-134` renders a grid of cards. Each card has: an icon area (40x40), a large number, a label, and a description. The skeleton must match this layout exactly.

```tsx
import Skeleton from '../ui/Skeleton';

const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-9 w-16" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
);

export default StatsSkeleton;
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/skeletons/StatsSkeleton.tsx
git commit -m "feat: add StatsSkeleton component"
```

---

### Task 3: Create TreeSkeleton Component

**Files:**
- Create: `src/components/skeletons/TreeSkeleton.tsx`

**Step 1: Create TreeSkeleton mimicking ExplorerView rows**

The real explorer view shows a tree with rows at various indentation levels. Each row has a folder/file icon area and a label. The skeleton should show 8-10 rows with varied widths and indentation to suggest a tree structure.

```tsx
import Skeleton from '../ui/Skeleton';

const rows = [
  { indent: 0, width: 'w-48' },
  { indent: 1, width: 'w-24' },
  { indent: 1, width: 'w-36' },
  { indent: 1, width: 'w-28' },
  { indent: 2, width: 'w-32' },
  { indent: 2, width: 'w-24' },
  { indent: 1, width: 'w-40' },
  { indent: 1, width: 'w-20' },
  { indent: 1, width: 'w-44' },
  { indent: 1, width: 'w-28' },
];

const TreeSkeleton = () => (
  <div className="p-4 space-y-3">
    {rows.map((row, i) => (
      <div key={i} className="flex items-center gap-3" style={{ paddingLeft: `${row.indent * 24}px` }}>
        <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
        <Skeleton className={`h-4 ${row.width}`} />
      </div>
    ))}
  </div>
);

export default TreeSkeleton;
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/skeletons/TreeSkeleton.tsx
git commit -m "feat: add TreeSkeleton component"
```

---

### Task 4: Create InsightsSkeleton Component

**Files:**
- Create: `src/components/skeletons/InsightsSkeleton.tsx`

**Step 1: Create InsightsSkeleton matching StructuralInsights layout**

The real component (`src/components/StructuralInsights.tsx`) has a health score card (icon + title + score) and a content distribution section (heading + bar chart rows).

```tsx
import Skeleton from '../ui/Skeleton';

const InsightsSkeleton = () => (
  <div className="space-y-6 mt-6">
    {/* Health score card skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>

    {/* Content distribution skeleton */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-3">
        {[80, 60, 40, 20, 10].map((width, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 flex-1 rounded-full" style={{ maxWidth: `${width}%` }} />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default InsightsSkeleton;
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/skeletons/InsightsSkeleton.tsx
git commit -m "feat: add InsightsSkeleton component"
```

---

### Task 5: Add Header Progress Bar and Status Text to App.tsx

**Files:**
- Modify: `src/App.tsx:544-575` (visualization header)

**Step 1: Add thin progress bar and status text to visualization header**

Inside the sticky header div (`src/App.tsx:545`), after the closing `</div>` of the main flex row (line 682), add a progress bar that shows during loading. This reuses the same visual pattern as the existing crawl progress bar at lines 687-715.

Add a thin progress bar below the header border:

```tsx
{/* Fetch progress bar - shown during sitemap loading */}
{isLoading && (
  <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">
          {progressMessage}
        </span>
        <span className="text-xs text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-primary-pink h-1 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {progressSubMessage && (
        <p className="text-xs text-gray-400 mt-1">{progressSubMessage}</p>
      )}
    </div>
  </div>
)}
```

Insert this after line 682 (the closing `</div>` of the flex row), before the existing crawl progress bar block at line 686.

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add thin progress bar to visualization header"
```

---

### Task 6: Replace Modal with Skeleton Shell in App.tsx

This is the main integration task. It changes the rendering logic so the visualization layout appears immediately with skeletons, and the blocking modal is removed.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Import skeleton components**

At the top of `App.tsx`, add imports:

```tsx
import StatsSkeleton from './components/skeletons/StatsSkeleton';
import TreeSkeleton from './components/skeletons/TreeSkeleton';
import InsightsSkeleton from './components/skeletons/InsightsSkeleton';
```

**Step 2: Change the visualization section gate**

Currently at `src/App.tsx:532`:
```tsx
{treeData && urls.length > 0 && (
```

Change to:
```tsx
{(treeData && urls.length > 0 || (isLoading && isVisualisationMode)) && (
```

This renders the visualization shell during loading too, not just when data is ready.

**Step 3: Replace real components with skeleton/real conditional rendering**

In the Stats Section (visualization mode, around lines 729-790), wrap the real content with a conditional:

Where `<SitemapStats>` and `<StructuralInsights>` are rendered, change to:

```tsx
{treeData && urls.length > 0 ? (
  <>
    <SitemapStats treeData={treeData} urls={urls} />
    <StructuralInsights treeData={treeData} urls={urls} />
    {/* ... verification report ... */}
  </>
) : (
  <>
    <StatsSkeleton />
    <InsightsSkeleton />
  </>
)}
```

**Step 4: Add skeleton to the view content area**

In the view rendering section (around lines 810-850), where ExplorerView/ColumnsView/GraphView are rendered, add a skeleton fallback:

```tsx
{treeData ? (
  <div className="animate-fade-in">
    {/* existing view rendering */}
  </div>
) : (
  <TreeSkeleton />
)}
```

**Step 5: Remove the blocking modal overlay**

Delete the entire modal section at `src/App.tsx:867-885`:
```tsx
{isLoading && (
  <section
    className={`transition-all duration-700 ease-in-out ${
      isVisualisationMode
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
        : 'section section-quaternary'
    }`}
    ...
  >
    ...
  </section>
)}
```

Replace with nothing — the progress is now shown inline in the header.

**Step 6: Remove the 1.5s artificial delay in the finally block**

At `src/App.tsx:218-229`, the `finally` block has a 1.5s setTimeout delay before setting `isLoading = false`. Replace the entire `finally` block with:

```tsx
} finally {
  setIsLoading(false);
  setProgress(0);
  isCompleteRef.current = false;
}
```

This removes the artificial delay so content appears immediately when ready.

**Step 7: Verify**

Run: `npx tsc --noEmit`

**Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: replace blocking modal with inline skeleton shell"
```

---

### Task 7: Handle the Non-Visualization Mode Loading State

**Files:**
- Modify: `src/App.tsx`

**Context:** When the app is NOT in visualization mode (e.g., first landing with a URL param), the loading state also needs updating. Currently the `!isVisualisationMode` path shows the same modal. Since `handleFetchSitemap` sets `isVisualisationMode(true)` immediately on line 84, the non-visualization loading path is effectively dead code. However, we should handle it defensively.

**Step 1: Verify the non-visualization loading path is unused**

Confirm that `handleFetchSitemap` (line 84) and `handleStartCrawl` (line 250) both set `setIsVisualisationMode(true)` before any async work. If so, `isLoading && !isVisualisationMode` can never be true simultaneously.

The deleted modal section already handled both modes with a ternary. Since we removed it in Task 6, no further action is needed. The skeleton shell always shows in visualization mode.

**Step 2: Commit (if any changes needed)**

---

### Task 8: Add CSS Transition for Skeleton-to-Content Cross-fade

**Files:**
- Modify: `src/App.tsx` (or relevant section components)

**Step 1: Add fade-in animation to real content**

The existing `animate-fade-in` class in the tailwind config (`fadeIn: 0% → opacity 0, translateY 20px; 100% → opacity 1, translateY 0`) works well for this. It's already used on the view content (`<div className="animate-fade-in">`).

Ensure the stats section and insights section also use `animate-fade-in` when transitioning from skeleton to real content. The conditional rendering in Task 6 already handles this — when `treeData` becomes truthy, React unmounts the skeleton and mounts the real component, which will play the `animate-fade-in` animation.

No additional CSS changes needed — the existing animation handles the transition.

**Step 2: Verify visually**

Start the dev server: `npm run dev`
Navigate to `http://localhost:5173`
Enter "portable.com.au" and submit.
Expected: See skeleton shell immediately, thin progress bar in header, content fades in when ready.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: skeleton loading complete - replaces blocking modal"
```

---

### Task 9: Clean Up Unused Code

**Files:**
- Modify: `src/App.tsx`

**Step 1: Remove the ProgressBar import if no longer used**

Check if `ProgressBar` is still imported at the top of App.tsx. If the modal is gone and ProgressBar is not used elsewhere, remove the import:

```tsx
// Remove this line:
import ProgressBar from './components/ProgressBar';
```

Also check if `isCompleteRef` is still needed. If the only use was the 1.5s delay (removed in Task 6), remove:
```tsx
// Remove:
const isCompleteRef = useRef(false);
// And all references to isCompleteRef.current
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "chore: remove unused ProgressBar import and isCompleteRef"
```
