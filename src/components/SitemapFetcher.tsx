import React, { useState, useRef } from 'react';
import { Globe, Search } from 'lucide-react';

interface SitemapFetcherProps {
  onFetch: (url: string) => void;
  isLoading: boolean;
}

const SitemapFetcher: React.FC<SitemapFetcherProps> = ({ onFetch, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Example URLs for better UX
  const exampleUrls = [
    'papergiant.net',
    'github.com',
    'docs.anthropic.com'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      inputRef.current?.focus();
      return;
    }

    // Clean and normalize the URL
    let normalizedUrl = url.trim();
    
    // Remove any trailing slashes for consistency
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');
    
    // Add https:// if no protocol is specified
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Check if it looks like a domain (contains a dot or is localhost)
      if (normalizedUrl.includes('.') || normalizedUrl === 'localhost' || normalizedUrl.startsWith('localhost:')) {
        normalizedUrl = `https://${normalizedUrl}`;
      } else {
        // Try adding .com if it's just a domain name without TLD
        if (!normalizedUrl.includes('/') && !normalizedUrl.includes(':')) {
          normalizedUrl = `https://${normalizedUrl}.com`;
        } else {
          normalizedUrl = `https://${normalizedUrl}`;
        }
      }
    }

    // Validate the final URL
    try {
      new URL(normalizedUrl);
      setError('');
      onFetch(normalizedUrl);
    } catch {
      setError('Please enter a valid URL (e.g., example.com or papergiant.net)');
      inputRef.current?.focus();
    }
  };
  
  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setError('');
    inputRef.current?.focus();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <section className="w-full max-w-2xl mx-auto" aria-label="Website URL input">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
Explore Your Website
          </h2>
          <p className="text-gray-600">
            Enter any website URL and we'll automatically find and visualise your website structure.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="sitemap-url" 
              className="block text-sm font-semibold text-gray-900"
            >
Website URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                ref={inputRef}
                type="text"
                id="sitemap-url"
                value={url}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter website URL (e.g., example.com)"
                className={`
                  block w-full rounded-xl border-2 bg-white pl-10 pr-4 py-4 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:ring-0 focus:outline-none
                  ${isFocused ? 'border-blue' : 'border-gray-200 hover:border-gray-300'}
                  ${error ? 'border-error' : ''}
                `}
                disabled={isLoading}
                aria-describedby={error ? 'url-error' : 'url-help'}
                aria-invalid={!!error}
                autoComplete="url"
              />
            </div>
            
            {error && (
              <div 
                id="url-error" 
                className="flex items-start space-x-2 text-sm text-error-700 mt-2"
                role="alert"
                aria-live="polite"
              >
                <svg 
                  className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <div id="url-help" className="text-xs text-gray-500 mt-1">
We'll automatically find your sitemap
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="bg-blue text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue/90 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue/20 w-full disabled:opacity-50"
            aria-describedby="submit-help"
          >
            {isLoading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
Exploring your site...
              </>
            ) : (
              'Explore Site'
            )}
          </button>
          
          <div id="submit-help" className="text-xs text-gray-500 text-center">
            We'll find and explore your website structure
          </div>
        </form>

        <div className="mt-6">
          <div className="text-sm text-gray-500 mb-3">Suggestions:</div>
          <div className="flex flex-wrap gap-2">
            {exampleUrls.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary-100 text-gray-600 hover:text-primary-700 rounded-full transition-colors duration-200"
                aria-label={`Try example URL: ${example}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SitemapFetcher;