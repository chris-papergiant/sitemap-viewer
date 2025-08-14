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
    inputRef.current?.focus();
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
                aria-describedby={error ? 'url-error' : 'url-help'}
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

          <div style={{ background: '#000000', borderRadius: '0', width: '100%' }}>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              style={{
                background: '#000000',
                backgroundColor: '#000000',
                backgroundImage: 'none',
                color: '#ffffff',
                border: 'none',
                outline: 'none',
                borderRadius: '0',
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: '700',
                minHeight: '3.25rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
                opacity: 1,
                transition: 'all 0.3s ease',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && url.trim()) {
                  e.currentTarget.style.background = '#333333';
                  e.currentTarget.style.backgroundColor = '#333333';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.background = '#333333';
                  }
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000000';
                e.currentTarget.style.backgroundColor = '#000000';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.background = '#000000';
                }
              }}
              aria-describedby="submit-help"
            >
              <span style={{ color: '#ffffff', fontSize: 'inherit', fontWeight: 'inherit', opacity: 1, textShadow: 'none' }}>
                {isLoading ? 'Visualising your sitemap...' : 'Visualise Sitemap'}
              </span>
            </button>
          </div>
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
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  color: '#DB1B5C',
                  border: '1px solid #DB1B5C',
                  borderRadius: '9999px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#DB1B5C';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#DB1B5C';
                }}
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