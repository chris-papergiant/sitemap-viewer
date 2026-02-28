import { TreeNode } from './treeBuilder';
import { SitemapEntry } from './sitemapParser';

export type IssueSeverity = 'info' | 'warning' | 'critical';

export interface StructuralIssue {
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedPaths: string[];
}

export interface SectionSummary {
  name: string;
  path: string;
  pageCount: number;
  maxDepth: number;
}

export interface StructuralReport {
  issues: StructuralIssue[];
  sections: SectionSummary[];
  healthScore: number; // 0-100
}

/**
 * Count all leaf/content pages under a node.
 */
function countPages(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countPages(child), 0);
}

/**
 * Find the max depth of a subtree.
 */
function maxDepth(node: TreeNode, current = 0): number {
  if (!node.children || node.children.length === 0) return current;
  return Math.max(...node.children.map(c => maxDepth(c, current + 1)));
}

/**
 * Collect all leaf nodes (pages with no children or with data).
 */
function collectLeaves(node: TreeNode, depth: number, result: { path: string; depth: number; data?: SitemapEntry }[]) {
  const isLeaf = !node.children || node.children.length === 0;
  if (isLeaf || node.data) {
    result.push({ path: node.path, depth, data: node.data });
  }
  if (node.children) {
    node.children.forEach(child => collectLeaves(child, depth + 1, result));
  }
}

/**
 * Analyze tree structure and return a report with issues and section summaries.
 */
export function analyzeStructure(treeData: TreeNode, urls: SitemapEntry[]): StructuralReport {
  const issues: StructuralIssue[] = [];
  const sections: SectionSummary[] = [];

  // Build section summaries from top-level children
  const topLevel = treeData.children || [];
  topLevel.forEach(section => {
    sections.push({
      name: section.name,
      path: section.path,
      pageCount: countPages(section),
      maxDepth: maxDepth(section),
    });
  });

  // Sort sections by page count descending
  sections.sort((a, b) => b.pageCount - a.pageCount);

  // --- Issue Detection ---

  // 1. Deep pages (depth > 3)
  const leaves: { path: string; depth: number; data?: SitemapEntry }[] = [];
  collectLeaves(treeData, 0, leaves);
  const deepPages = leaves.filter(l => l.depth > 3);
  if (deepPages.length > 0) {
    issues.push({
      severity: deepPages.length > 10 ? 'warning' : 'info',
      title: `${deepPages.length} deeply nested page${deepPages.length === 1 ? '' : 's'}`,
      description: 'Pages more than 3 levels deep are harder for search engines to discover and for users to find.',
      affectedPaths: deepPages.slice(0, 5).map(p => p.path),
    });
  }

  // 2. Thin sections (top-level sections with only 1 page)
  const thinSections = sections.filter(s => s.pageCount === 1);
  if (thinSections.length > 0) {
    issues.push({
      severity: thinSections.length > 3 ? 'warning' : 'info',
      title: `${thinSections.length} thin section${thinSections.length === 1 ? '' : 's'}`,
      description: 'Sections with only one page may indicate orphaned content or incomplete site areas.',
      affectedPaths: thinSections.map(s => s.path),
    });
  }

  // 3. Imbalanced hierarchy
  if (sections.length >= 2) {
    const largest = sections[0].pageCount;
    const smallest = sections[sections.length - 1].pageCount;
    if (largest > 10 && smallest > 0 && largest / smallest > 20) {
      issues.push({
        severity: 'info',
        title: 'Imbalanced site structure',
        description: `"${sections[0].name}" has ${sections[0].pageCount} pages while "${sections[sections.length - 1].name}" has only ${sections[sections.length - 1].pageCount}. Large imbalances can make navigation harder.`,
        affectedPaths: [sections[0].path, sections[sections.length - 1].path],
      });
    }
  }

  // 4. Missing metadata
  const noLastmod = urls.filter(u => !u.lastmod);
  const noPriority = urls.filter(u => u.priority === undefined || u.priority === null);
  if (noLastmod.length > urls.length * 0.5 && urls.length > 5) {
    issues.push({
      severity: 'warning',
      title: `${Math.round((noLastmod.length / urls.length) * 100)}% of pages missing last modified date`,
      description: 'Without lastmod dates, search engines cannot efficiently determine which pages have changed.',
      affectedPaths: noLastmod.slice(0, 3).map(u => u.loc),
    });
  }
  if (noPriority.length > urls.length * 0.5 && urls.length > 5) {
    issues.push({
      severity: 'info',
      title: `${Math.round((noPriority.length / urls.length) * 100)}% of pages missing priority`,
      description: 'Priority values help search engines understand relative page importance within your site.',
      affectedPaths: noPriority.slice(0, 3).map(u => u.loc),
    });
  }

  // 5. Stale content (pages not updated in over 1 year)
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const stalePages = urls.filter(u => {
    if (!u.lastmod) return false;
    return new Date(u.lastmod) < oneYearAgo;
  });
  if (stalePages.length > 5) {
    issues.push({
      severity: stalePages.length > urls.length * 0.5 ? 'warning' : 'info',
      title: `${stalePages.length} page${stalePages.length === 1 ? '' : 's'} not updated in over a year`,
      description: 'Stale content can negatively affect search rankings and user trust.',
      affectedPaths: stalePages.slice(0, 3).map(u => u.loc),
    });
  }

  // Calculate health score (100 = perfect, deduct for issues)
  let score = 100;
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical': score -= 20; break;
      case 'warning': score -= 10; break;
      case 'info': score -= 3; break;
    }
  });
  const healthScore = Math.max(0, Math.min(100, score));

  return { issues, sections, healthScore };
}
