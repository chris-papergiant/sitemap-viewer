import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, Clock, AlertCircle, Search, MapPin } from 'lucide-react';
import { TreeNode } from '../../utils/treeBuilder';

interface ExplorerViewProps {
  data: TreeNode;
  searchQuery?: string;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  searchQuery?: string;
  expandedNodes: Set<string>;
  onToggle: (path: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ 
  node, 
  level, 
  searchQuery,
  expandedNodes,
  onToggle
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.path);
  const indent = level * 20;
  
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return node.name.toLowerCase().includes(query) || 
           node.path.toLowerCase().includes(query);
  }, [searchQuery, node]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.path);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(e);
    }
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.data?.loc) {
      window.open(node.data.loc, '_blank');
    }
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'text-gray-400';
    if (priority >= 0.8) return 'text-primary-pink';
    if (priority >= 0.5) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!matchesSearch && !hasChildren) {
    return null;
  }

  return (
    <div className={`${!matchesSearch ? 'opacity-50' : ''}`} data-path={node.path}>
      <div
        className={`
          flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:ring-offset-1
          ${matchesSearch && searchQuery ? 'bg-primary-pink/5 border border-primary-pink/20' : ''}
        `}
        style={{ paddingLeft: `${Math.max(16, indent + 16)}px` }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-label={hasChildren ? 
          `${isExpanded ? 'Collapse' : 'Expand'} ${node.name}${node.children ? ` with ${node.children.length} items` : ''}` :
          `URL: ${node.name}`
        }
      >
        <div className="flex items-center flex-1 min-w-0">
          {hasChildren ? (
            <button className="p-0.5 mr-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-primary-pink" />
              ) : (
                <ChevronRight className="w-4 h-4 text-primary-pink" />
              )}
            </button>
          ) : (
            <span className="w-5 mr-1" />
          )}
          
          <span className="truncate text-sm font-medium text-gray-800">
            {node.name}
          </span>
          
          {node.children && node.children.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({node.children.length})
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-2">
          {node.data && (
            <>
              {node.data.priority !== undefined && (
                <span 
                  className={`text-xs font-medium ${getPriorityColor(node.data.priority)}`}
                  title={`Priority: ${node.data.priority}`}
                >
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}
              
              {node.data.lastmod && (
                <span 
                  className="text-xs text-gray-500 flex items-center"
                  title={`Last modified: ${node.data.lastmod}`}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDate(node.data.lastmod)}
                </span>
              )}
              
              <button
                onClick={handleOpenUrl}
                className="p-1 hover:bg-gray-200 rounded"
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3 text-gray-600" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeItem
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ExplorerView: React.FC<ExplorerViewProps> = ({ data, searchQuery }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([data.path])
  );

  // Find all matching nodes and their paths
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const results: { node: TreeNode; path: TreeNode[] }[] = [];
    
    const searchNode = (node: TreeNode, path: TreeNode[] = []) => {
      const currentPath = [...path, node];
      const query = searchQuery.toLowerCase();
      const matches = node.name.toLowerCase().includes(query) || 
                     (node.data?.loc && node.data.loc.toLowerCase().includes(query));
      
      if (matches && node.data?.loc) {
        results.push({ node, path: currentPath });
      }
      
      if (node.children) {
        node.children.forEach(child => searchNode(child, currentPath));
      }
    };
    
    searchNode(data);
    return results.slice(0, 10); // Limit to 10 results for performance
  }, [data, searchQuery]);

  // Auto-expand paths to search results
  useEffect(() => {
    if (searchQuery && searchResults.length > 0) {
      const pathsToExpand = new Set(expandedNodes);
      searchResults.forEach(({ path }) => {
        path.forEach(node => {
          pathsToExpand.add(node.path);
        });
      });
      setExpandedNodes(pathsToExpand);
    }
  }, [searchQuery, searchResults]);

  const handleToggle = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (node: TreeNode) => {
      allPaths.add(node.path);
      if (node.children) {
        node.children.forEach(collectPaths);
      }
    };
    collectPaths(data);
    setExpandedNodes(allPaths);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set([data.path]));
  };

  const navigateToResult = (resultPath: TreeNode[]) => {
    const pathsToExpand = new Set(expandedNodes);
    resultPath.forEach(node => {
      pathsToExpand.add(node.path);
    });
    setExpandedNodes(pathsToExpand);
    
    // Scroll to the item after a brief delay to allow expansion
    setTimeout(() => {
      const element = document.querySelector(`[data-path="${resultPath[resultPath.length - 1].path}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div 
      className="bg-white" 
      id="explorer-panel"
      role="tabpanel"
      aria-labelledby="explorer-tab"
    >
      {/* Search Results Panel */}
      {searchQuery && (
        <div className="border-b border-gray-200 bg-primary-pink/5 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-primary-pink" />
            <h3 className="text-sm font-semibold text-gray-900">
              {searchResults.length > 0 
                ? `Found ${searchResults.length} matching page${searchResults.length !== 1 ? 's' : ''}`
                : 'No matching pages found'
              }
            </h3>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map(({ node, path }, index) => (
              <div key={`${node.path}-${index}`} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {node.name}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {path.slice(1, -1).map(p => p.name).join(' › ')}
                      {path.length > 2 && (
                        <span className="ml-1 text-gray-400">› {node.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => navigateToResult(path)}
                      className="bg-primary-pink text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-pink/90 transition-colors"
                      title="Navigate to this item in the tree"
                    >
                      Go to
                    </button>
                    {node.data?.loc && (
                      <button
                        onClick={() => window.open(node.data!.loc, '_blank')}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3 h-3 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="text-sm text-gray-500">
                Try searching for page names, URLs, or path segments from your sitemap.
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Site Structure Explorer
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Navigate through your sitemap hierarchy with expandable folders
            {searchQuery && ` • Searching for "${searchQuery}"`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={expandAll}
            className="btn btn-secondary text-xs px-3 py-1.5 min-h-touch-target"
            title="Expand all folders to show full structure"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="btn btn-secondary text-xs px-3 py-1.5 min-h-touch-target"
            title="Collapse all folders to show only top level"
          >
            Collapse All
          </button>
        </div>
      </div>
      
      <div 
        className="p-6 h-full min-h-[400px] max-h-[600px] overflow-y-auto focus:outline-none"
        tabIndex={-1}
        role="tree"
        aria-label="Sitemap structure tree"
      >
        <div data-path={data.path}>
          <TreeItem
            node={data}
            level={0}
            searchQuery={searchQuery}
            expandedNodes={expandedNodes}
            onToggle={handleToggle}
          />
        </div>
      </div>
      
      {/* Mobile scroll indicator */}
      <div className="md:hidden px-6 py-2 border-t border-gray-200 bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          Scroll to explore • Tap items to expand folders
        </p>
      </div>
    </div>
  );
};

export default ExplorerView;