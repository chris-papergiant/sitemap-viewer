import React, { useState, useRef, useEffect } from 'react';
import { Folder, File, ExternalLink, ChevronRight } from 'lucide-react';
import { TreeNode } from '../../utils/treeBuilder';

interface ColumnsViewProps {
  data: TreeNode;
  searchQuery?: string;
}

interface ColumnData {
  node: TreeNode;
  items: TreeNode[];
  selectedIndex: number | null;
}

const ColumnsView: React.FC<ColumnsViewProps> = ({ data, searchQuery }) => {
  const [columns, setColumns] = useState<ColumnData[]>([
    {
      node: data,
      items: data.children || [],
      selectedIndex: null
    }
  ]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (columnIndex: number, itemIndex: number) => {
    const newColumns = [...columns.slice(0, columnIndex + 1)];
    const selectedItem = newColumns[columnIndex].items[itemIndex];
    
    // Update selection in current column
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      selectedIndex: itemIndex
    };
    
    // Add new column if item has children
    if (selectedItem.children && selectedItem.children.length > 0) {
      newColumns.push({
        node: selectedItem,
        items: selectedItem.children,
        selectedIndex: null
      });
    }
    
    setColumns(newColumns);
    setSelectedUrl(selectedItem.data?.loc || null);
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const matchesSearch = (node: TreeNode): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return node.name.toLowerCase().includes(query) || 
           node.path.toLowerCase().includes(query);
  };

  // Auto-scroll to show new columns
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [columns.length]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white flex flex-col h-[600px]">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-1 text-sm">
          {columns.map((col, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              <span className={`${idx === columns.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {col.node.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex-1 flex overflow-x-auto" ref={scrollContainerRef}>
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="min-w-[250px] border-r border-gray-200 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto">
              {column.items.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No items
                </div>
              ) : (
                column.items.map((item, itemIndex) => {
                  const isSelected = column.selectedIndex === itemIndex;
                  const hasChildren = item.children && item.children.length > 0;
                  const matches = matchesSearch(item);
                  
                  if (!matches && !hasChildren) return null;
                  
                  return (
                    <div
                      key={itemIndex}
                      onClick={() => handleItemClick(columnIndex, itemIndex)}
                      className={`
                        px-4 py-2 cursor-pointer border-b border-gray-100
                        ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'}
                        ${!matches ? 'opacity-50' : ''}
                        ${matches && searchQuery ? 'bg-yellow-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          {hasChildren ? (
                            <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">
                            {item.name}
                          </span>
                          {hasChildren && item.children && (
                            <span className="text-xs text-gray-500">
                              ({item.children.length})
                            </span>
                          )}
                        </div>
                        {hasChildren && (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
        
        {/* Details Panel */}
        {selectedUrl && (
          <div className="min-w-[300px] bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">URL Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">URL</label>
                <div className="mt-1 flex items-center space-x-2">
                  <p className="text-sm text-gray-900 break-all flex-1">{selectedUrl}</p>
                  <button
                    onClick={() => openInNewTab(selectedUrl)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {columns[columns.length - 1].selectedIndex !== null && (
                <>
                  {columns[columns.length - 1].items[columns[columns.length - 1].selectedIndex!].data?.lastmod && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Last Modified</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(columns[columns.length - 1].items[columns[columns.length - 1].selectedIndex!].data?.lastmod)}
                      </p>
                    </div>
                  )}
                  
                  {columns[columns.length - 1].items[columns[columns.length - 1].selectedIndex!].data?.changefreq && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Change Frequency</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {columns[columns.length - 1].items[columns[columns.length - 1].selectedIndex!].data?.changefreq}
                      </p>
                    </div>
                  )}
                  
                  {columns[columns.length - 1].items[columns[columns.length - 1].selectedIndex!].data?.priority !== undefined && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Priority</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {columns[columns.length - 1].items[columns[columns.length - 1].selectedIndex!].data?.priority}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColumnsView;