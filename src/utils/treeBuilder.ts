import { SitemapEntry } from './sitemapParser';

export interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  data?: SitemapEntry;
}

export const buildTreeFromUrls = (urls: SitemapEntry[]): TreeNode => {
  if (urls.length === 0) {
    return {
      name: 'root',
      path: '/',
      children: []
    };
  }

  // Get the domain from the first URL
  const firstUrl = new URL(urls[0].loc);
  const domain = firstUrl.hostname;
  
  const root: TreeNode = {
    name: domain,
    path: firstUrl.origin,
    children: []
  };

  urls.forEach(entry => {
    try {
      const url = new URL(entry.loc);
      const pathParts = url.pathname.split('/').filter(part => part !== '');
      
      // If it's the homepage (no path parts), add it as root data
      if (pathParts.length === 0) {
        if (!root.data) {
          root.data = entry;
        }
        return;
      }
      
      let currentNode = root;
      let currentPath = url.origin;

      pathParts.forEach((part, index) => {
        currentPath += '/' + part;
        
        if (!currentNode.children) {
          currentNode.children = [];
        }

        let existingChild = currentNode.children.find(child => child.name === part);
        
        if (!existingChild) {
          existingChild = {
            name: decodeURIComponent(part), // Decode URL-encoded parts
            path: currentPath,
            children: [],
            data: index === pathParts.length - 1 ? entry : undefined
          };
          currentNode.children.push(existingChild);
        } else if (index === pathParts.length - 1 && !existingChild.data) {
          // Update data if this is the final part and no data exists
          existingChild.data = entry;
        }
        
        currentNode = existingChild;
      });
    } catch (error) {
      console.error('Error processing URL:', entry.loc, error);
    }
  });

  // Sort children alphabetically at each level
  const sortChildren = (node: TreeNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(sortChildren);
    }
  };
  
  sortChildren(root);

  return root;
};

export const getTreeStats = (node: TreeNode, depth = 0): { totalNodes: number; maxDepth: number } => {
  let totalNodes = 1;
  let maxDepth = depth;

  if (node.children) {
    node.children.forEach(child => {
      const childStats = getTreeStats(child, depth + 1);
      totalNodes += childStats.totalNodes;
      maxDepth = Math.max(maxDepth, childStats.maxDepth);
    });
  }

  return { totalNodes, maxDepth };
};