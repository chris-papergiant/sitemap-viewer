import React, { useState, useRef, useEffect } from 'react';
import { FolderTreeIcon, ColumnsIcon, NetworkIcon, Search, X } from 'lucide-react';

export type ViewType = 'explorer' | 'columns' | 'graph';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  urlCount: number;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ 
  currentView, 
  onViewChange, 
  urlCount,
  searchQuery = '',
  onSearch 
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && localSearchQuery !== searchQuery) {
        onSearch(localSearchQuery);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch]);
  
  const views: { 
    type: ViewType; 
    label: string; 
    icon: React.ReactNode; 
    description: string;
    color: string;
  }[] = [
    {
      type: 'explorer',
      label: 'Explorer',
      icon: <FolderTreeIcon className="h-4 w-4" />,
      description: 'Tree view with folders',
      color: 'pink'
    },
    {
      type: 'columns',
      label: 'Columns',
      icon: <ColumnsIcon className="h-4 w-4" />,
      description: 'Miller columns navigation',
      color: 'blue'
    },
    {
      type: 'graph',
      label: 'Graph',
      icon: <NetworkIcon className="h-4 w-4" />,
      description: 'Visual tree diagram',
      color: 'teal'
    }
  ];
  
  const handleViewChange = (newView: ViewType) => {
    if (newView === currentView) return;
    onViewChange(newView);
  };
  
  const handleClearSearch = () => {
    setLocalSearchQuery('');
    if (onSearch) onSearch('');
    searchInputRef.current?.focus();
  };

  // Find active view (currently unused but may be needed later)
  // const activeView = views.find(v => v.type === currentView);

  return (
    <div 
      className="bg-white border-b border-primary-pink-100"
      aria-label="View controls"
      role="region"
    >
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Clean tab-style view switcher */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-full p-1">
              {views.map((view) => {
                const isActive = currentView === view.type;
                
                return (
                  <button
                    key={view.type}
                    onClick={() => handleViewChange(view.type)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${view.label} view`}
                    title={view.description}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-black text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }
                    `}
                  >
                    {React.cloneElement(view.icon as React.ReactElement, {
                      className: `h-4 w-4 ${isActive ? 'text-white' : ''}`
                    })}
                    <span className={isActive ? 'text-white' : ''}>{view.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* URL count badge */}
            <div className="flex items-center">
              <span className="bg-primary-pink text-white px-4 py-2 rounded-full text-sm font-semibold">
                {urlCount.toLocaleString()} URLs
              </span>
            </div>
          </div>
          
          {/* Clean search */}
          {onSearch && (
            <div className="flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleClearSearch();
                    }
                  }}
                  placeholder="Filter URLs..."
                  className="pl-9 pr-8 py-2 w-48 sm:w-56 text-sm bg-gray-50 border border-gray-200 
                    rounded-full placeholder-gray-400 text-gray-900
                    focus:outline-none focus:ring-2 focus:ring-primary-pink/20 focus:border-primary-pink transition-all"
                  aria-label="Search URLs"
                />
                {localSearchQuery && (
                  <button
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSwitcher;