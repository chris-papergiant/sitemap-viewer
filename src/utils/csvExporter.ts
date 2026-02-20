import { TreeNode } from './treeBuilder';

interface CSVRow {
  [key: string]: string;
}

/**
 * Converts a tree structure to CSV format with depth preserved in columns
 * @param rootNode - The root node of the tree
 * @returns CSV string with hierarchy preserved in columns
 */
export function treeToCSV(rootNode: TreeNode): string {
  const rows: CSVRow[] = [];
  let maxDepth = 0;

  // Recursive function to traverse the tree and build rows
  function traverseNode(node: TreeNode, depth: number = 0, parentPath: string[] = []) {
    const currentPath = [...parentPath];
    
    // Add current node to its depth column
    currentPath[depth] = node.name;
    
    // Create a row object with the path
    const row: CSVRow = {};
    for (let i = 0; i <= depth; i++) {
      row[`Level ${i + 1}`] = currentPath[i] || '';
    }
    
    // Add URL and metadata if available
    if (node.data?.loc) {
      row['URL'] = node.data.loc;
      row['Last Modified'] = node.data.lastmod || '';
      row['Change Frequency'] = node.data.changefreq || '';
      row['Priority'] = node.data.priority?.toString() || '';
    }
    
    rows.push(row);
    maxDepth = Math.max(maxDepth, depth);
    
    // Traverse children
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        traverseNode(child, depth + 1, currentPath);
      });
    }
  }

  // Start traversal from root
  traverseNode(rootNode);

  // Generate CSV headers
  const headers: string[] = [];
  for (let i = 0; i <= maxDepth; i++) {
    headers.push(`Level ${i + 1}`);
  }
  headers.push('URL', 'Last Modified', 'Change Frequency', 'Priority');

  // Convert to CSV format
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add data rows
  rows.forEach(row => {
    const csvRow = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(csvRow.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Downloads a CSV string as a file
 * @param csvContent - The CSV content to download
 * @param filename - The name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string = 'sitemap.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Exports tree data to CSV and triggers download
 * @param treeData - The tree data to export
 * @param siteName - Optional site name for the filename
 */
export function exportTreeToCSV(treeData: TreeNode, siteName?: string) {
  const csvContent = treeToCSV(treeData);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = siteName 
    ? `${siteName.replace(/[^a-z0-9]/gi, '_')}_sitemap_${timestamp}.csv`
    : `sitemap_${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
}