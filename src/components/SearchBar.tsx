import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Zap } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search URLs...",
  resultCount,
  totalCount 
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'regex'>('text');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout with longer delay for regex
    const delay = searchMode === 'regex' ? 500 : 300;
    searchTimeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, delay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, onSearch, searchMode]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (query) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };
  
  const getSearchStats = () => {
    if (!query) return null;
    if (resultCount !== undefined && totalCount !== undefined) {
      const percentage = Math.round((resultCount / totalCount) * 100);
      return { count: resultCount, total: totalCount, percentage };
    }
    return null;
  };
  
  const stats = getSearchStats();

  return (
    <section className="card p-6 space-y-4" aria-label="Search sitemap URLs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Search & Filter
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Search through URLs using text matching or regex patterns
          </p>
        </div>
        
        {stats && (
          <div 
            className="flex items-center space-x-2 px-3 py-1.5 bg-secondary-50 text-secondary-700 rounded-full border border-secondary-200"
            role="status"
            aria-live="polite"
            aria-label={`Found ${stats.count} results out of ${stats.total} URLs`}
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium">{stats.count}</span>
            <span className="text-secondary-600">of {stats.total}</span>
            <span className="text-xs text-secondary-500">({stats.percentage}%)</span>
          </div>
        )}
      </div>
      
      {/* Search Input */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              input w-full pl-10 pr-20 py-3 text-base
              ${isFocused ? 'ring-2 ring-primary-500 border-primary-500' : ''}
            `}
            placeholder={placeholder}
            aria-label="Search URLs"
            aria-describedby="search-help search-stats"
            autoComplete="off"
            spellCheck={false}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
            {query && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Clear search (ESC)"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`
                p-1 rounded transition-colors
                ${showAdvanced ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 text-gray-500'}
              `}
              title="Toggle advanced options"
              aria-label="Toggle advanced search options"
              aria-expanded={showAdvanced}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Search Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Search mode:</span>
            <div className="flex bg-gray-100 rounded-lg p-1" role="tablist" aria-label="Search mode">
              <button
                onClick={() => setSearchMode('text')}
                className={`
                  px-3 py-1 text-sm font-medium rounded-md transition-all
                  ${searchMode === 'text'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }
                `}
                role="tab"
                aria-selected={searchMode === 'text'}
                title="Simple text search"
              >
                Text
              </button>
              <button
                onClick={() => setSearchMode('regex')}
                className={`
                  px-3 py-1 text-sm font-medium rounded-md transition-all
                  ${searchMode === 'regex'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }
                `}
                role="tab"
                aria-selected={searchMode === 'regex'}
                title="Regular expression pattern matching"
              >
                Regex
              </button>
            </div>
          </div>
          
          {query && (
            <div className="text-xs text-gray-500">
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">ESC</kbd> to clear
            </div>
          )}
        </div>
        
        {/* Advanced Options */}
        {showAdvanced && (
          <div className="animate-slide-up bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Search Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <div className="font-medium text-gray-800 mb-1">Text Search:</div>
                <ul className="space-y-1">
                  <li>• Case insensitive</li>
                  <li>• Matches partial words</li>
                  <li>• Example: "blog" finds "/blog/post"</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-gray-800 mb-1">Regex Search:</div>
                <ul className="space-y-1">
                  <li>• Pattern matching</li>
                  <li>• Example: "/blog/\\d+" finds numbered posts</li>
                  <li>• Use ".*" for wildcards</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Status */}
        <div 
          id="search-help" 
          className="text-xs text-gray-500"
          aria-live="polite"
        >
          {!query ? (
            `Start typing to search through ${totalCount?.toLocaleString() || 0} URLs`
          ) : searchMode === 'regex' ? (
            'Using regular expression pattern matching'
          ) : (
            'Using simple text search'
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchBar;