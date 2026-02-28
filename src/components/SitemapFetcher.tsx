import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';

interface SitemapFetcherProps {
  onFetch: (url: string) => void;
  isLoading: boolean;
}

const SitemapFetcher: React.FC<SitemapFetcherProps> = ({ onFetch, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
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
    // Normalize and submit directly
    const normalizedUrl = `https://${exampleUrl}`;
    onFetch(normalizedUrl);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <section className="w-full max-w-3xl mx-auto" aria-label="Website URL input">
      <div className="card p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label htmlFor="sitemap-url" className="sr-only">Website URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              </div>
              <input
                ref={inputRef}
                type="text"
                id="sitemap-url"
                value={url}
                onChange={handleInputChange}
                placeholder="Enter website URL (e.g., papergiant.net)"
                className={`input input-lg pl-12 ${
                  error ? 'border-error' : ''
                }`}
                disabled={isLoading}
                aria-describedby={error ? 'url-error' : undefined}
                aria-invalid={!!error}
                autoComplete="url"
              />
            </div>
            
            {error && (
              <div 
                id="url-error" 
                className="flex items-start space-x-2 text-sm text-error mt-3 p-3 bg-error-50 rounded-lg border border-error-200"
                role="alert"
                aria-live="polite"
              >
                <svg 
                  className="h-4 w-4 text-error mt-0.5 flex-shrink-0" 
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
                <span className="font-body">{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="bg-black text-white rounded-lg px-6 py-3 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full font-medium"
          >
            {isLoading ? 'Visualising your sitemap...' : 'Visualise Sitemap'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="text-sm text-neutral-600 font-body mb-4">Try these examples:</div>
          <div className="flex flex-wrap gap-2">
            {exampleUrls.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                aria-label={`Try example URL: ${example}`}
                className="px-4 py-2 text-sm bg-transparent text-primary-pink border border-primary-pink rounded-full hover:bg-primary-pink hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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