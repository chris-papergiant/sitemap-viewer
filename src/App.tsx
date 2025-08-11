import { useState, useRef, useEffect } from 'react';
import SitemapFetcher from './components/SitemapFetcher';
import SitemapStats from './components/SitemapStats';
import ProgressBar from './components/ProgressBar';
import ViewSwitcher, { ViewType } from './components/ViewSwitcher';
import ExplorerView from './components/views/ExplorerView';
import ColumnsView from './components/views/ColumnsView';
import GraphView from './components/views/GraphView';
import { fetchSitemap, parseSitemapXML, SitemapEntry } from './utils/sitemapParser';
import { buildTreeFromUrls, TreeNode } from './utils/treeBuilder';

// URL parameter utilities for shareable links
const updateUrlParams = (url: string, view: ViewType) => {
  const params = new URLSearchParams();
  params.set('url', encodeURIComponent(url));
  params.set('view', view);
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    url: params.get('url') ? decodeURIComponent(params.get('url')!) : null,
    view: (params.get('view') as ViewType) || 'explorer'
  };
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [urls, setUrls] = useState<SitemapEntry[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressSubMessage, setProgressSubMessage] = useState('');
  const [currentView, setCurrentView] = useState<ViewType>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisualisationMode, setIsVisualisationMode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const isCompleteRef = useRef(false);

  const handleFetchSitemap = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setTreeData(null);
    setUrls([]);
    setProgress(0);
    setProgressMessage('Initializing...');
    setProgressSubMessage('');
    setIsVisualisationMode(true);
    setCurrentUrl(url);
    isCompleteRef.current = false;

    try {
      console.log('Starting sitemap fetch for:', url);
      
      setProgress(10);
      setProgressMessage('Fetching sitemap...');
      setProgressSubMessage(`Connecting to ${url}`);
      
      const xmlContent = await fetchSitemap(url, (message) => {
        setProgressSubMessage(message);
      });
      
      setProgress(30);
      setProgressMessage('Parsing XML content...');
      setProgressSubMessage('Understanding your site structure');
      console.log('XML content fetched, parsing...');
      
      const parsed = parseSitemapXML(xmlContent);
      
      if (parsed.sitemaps && parsed.sitemaps.length > 0) {
        console.log(`Processing sitemap index with ${parsed.sitemaps.length} sitemaps`);
        setProgressMessage('Processing sitemap index...');
        setProgressSubMessage(`Found ${parsed.sitemaps.length} nested sitemaps`);
        
        const allUrls: SitemapEntry[] = [];
        const totalSitemaps = parsed.sitemaps.length;
        
        for (let i = 0; i < totalSitemaps; i++) {
          const sitemapUrl = parsed.sitemaps[i];
          const progressPercent = 30 + ((i / totalSitemaps) * 50);
          setProgress(progressPercent);
          setProgressMessage(`Fetching nested sitemaps...`);
          setProgressSubMessage(`Processing ${i + 1} of ${totalSitemaps} sitemaps`);
          
          try {
            console.log(`Fetching nested sitemap: ${sitemapUrl}`);
            const subXml = await fetchSitemap(sitemapUrl, (message) => {
              setProgressSubMessage(`Processing ${i + 1} of ${totalSitemaps} - ${message}`);
            });
            const subParsed = parseSitemapXML(subXml);
            allUrls.push(...subParsed.urls);
            
            // Update with current URL count
            setProgressSubMessage(`Processing ${i + 1} of ${totalSitemaps} - Found ${allUrls.length} URLs so far`);
          } catch (err) {
            console.error(`Failed to fetch nested sitemap: ${sitemapUrl}`, err);
          }
        }
        
        if (allUrls.length > 0) {
          setProgress(85);
          setProgressMessage('Building your site view...');
          setProgressSubMessage(`Organising ${allUrls.length} pages for you`);
          console.log(`Total URLs collected: ${allUrls.length}`);
          
          setUrls(allUrls);
          const tree = buildTreeFromUrls(allUrls);
          setTreeData(tree);
          
          setProgress(100);
          setProgressMessage('Complete!');
          setProgressSubMessage(`Successfully visualised ${allUrls.length} URLs`);
          isCompleteRef.current = true;
          
          // Update URL parameters for sharing
          updateUrlParams(url, currentView);
        } else {
          setError('No URLs found in the sitemap index. The sitemap might be empty or in an unsupported format.');
        }
      } else if (parsed.urls.length > 0) {
        setProgress(60);
        setProgressMessage('Processing URLs...');
        setProgressSubMessage(`Found ${parsed.urls.length} URLs`);
        console.log(`Found ${parsed.urls.length} URLs in sitemap`);
        
        setProgress(85);
        setProgressMessage('Building your site view...');
        setProgressSubMessage(`Organising ${parsed.urls.length} pages for you`);
        
        setUrls(parsed.urls);
        const tree = buildTreeFromUrls(parsed.urls);
        setTreeData(tree);
        
        setProgress(100);
        setProgressMessage('Complete!');
        setProgressSubMessage(`Successfully visualised ${parsed.urls.length} URLs`);
        isCompleteRef.current = true;
        
        // Update URL parameters for sharing
        updateUrlParams(url, currentView);
      } else {
        setError('No URLs found in the sitemap. The sitemap might be empty or in an unsupported format.');
      }
    } catch (err) {
      console.error('Error during sitemap fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch or parse sitemap');
    } finally {
      // Keep the progress bar visible for a moment at 100%
      if (isCompleteRef.current) {
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          isCompleteRef.current = false;
        }, 1500);
      } else {
        setIsLoading(false);
        setProgress(0);
      }
    }
  };

  // Load from URL parameters on initial load
  useEffect(() => {
    const { url, view } = getUrlParams();
    if (url) {
      setCurrentView(view);
      handleFetchSitemap(url);
    }
  }, []);

  // Handle view changes and update URL
  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    if (currentUrl) {
      updateUrlParams(currentUrl, view);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Navigation for Screen Readers */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      
      {!isVisualisationMode && (
        <header 
          className="bg-white shadow-sm border-b border-gray-100"
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Sitemap Visualiser
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Understand your website structure at a glance
                </p>
              </div>
              <div className="w-12 h-12 bg-blue rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
          </div>
        </header>
      )}

      <main 
        id="main-content" 
        className={`transition-all duration-700 ease-in-out ${
          isVisualisationMode ? 'pt-4' : 'max-w-7xl mx-auto px-6 py-8'
        }`} 
        role="main"
        tabIndex={-1}
      >
        {!isVisualisationMode && (
          <div>
            <SitemapFetcher onFetch={handleFetchSitemap} isLoading={isLoading} />
          </div>
        )}
        
        {error && (
          <div 
            className={`animate-slide-up ${
              isVisualisationMode 
                ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-2xl px-4'
                : 'mt-12'
            }`} 
            role="alert" 
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="card-gradient p-8 border-l-8 border-l-error-500 bg-gradient-to-r from-error-50 to-error-100/50 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <div className="w-full h-full bg-gradient-to-bl from-error-400 to-error-500 rounded-full blur-3xl" />
              </div>
              
              <div className="flex items-start gap-6 relative z-10">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-error-500 to-error-600 p-3 rounded-2xl shadow-medium">
                    <svg 
                      className="h-6 w-6 text-white" 
                      viewBox="0 0 20 20" 
                      fill="currentColor" 
                      aria-hidden="true"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-error-800 mb-3">
                    🚨 Oops! Something went wrong
                  </h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                    <p className="text-base text-error-700 font-medium leading-relaxed">{error}</p>
                  </div>
                  <div className="mt-4 text-sm text-error-600">
                    💡 Try checking the URL or wait a moment before trying again
                  </div>
                  {isVisualisationMode && (
                    <button
                      onClick={() => setIsVisualisationMode(false)}
                      className="mt-4 btn btn-secondary"
                    >
                      Back to Input
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {treeData && urls.length > 0 && (
          <section 
            className={`transition-all duration-1000 ease-in-out ${
              isVisualisationMode 
                ? 'fixed inset-x-0 top-0 bottom-0 z-50 bg-gray-50 overflow-auto px-4 py-8'
                : 'mt-12 space-y-8 animate-fade-in'
            }`} 
            aria-label="Sitemap visualisation"
          >
            {/* Visualization mode header */}
            {isVisualisationMode && (
              <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 animate-slide-down-fade">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                  <button
                    onClick={() => setIsVisualisationMode(false)}
                    className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors duration-200 flex items-center gap-2 text-gray-700 hover:text-blue"
                    aria-label="Exit fullscreen visualisation"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="font-medium">Back</span>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 919-9" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {currentUrl ? (currentUrl.includes('://') ? new URL(currentUrl).hostname : currentUrl) : 'Sitemap'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                      {urls.length} URLs
                    </span>
                    <span className="bg-success-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className={`transition-all duration-700 ease-in-out ${
              isVisualisationMode ? 'max-w-7xl mx-auto mt-16 mb-12' : 'mb-12'
            }`}>
              <SitemapStats treeData={treeData} urls={urls} />
            </div>
            
            {/* Connected view switcher and visualisation container */}
            <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-700 ease-in-out ${
              isVisualisationMode ? 'max-w-7xl mx-auto min-h-[600px] animate-zoom-in' : ''
            }`}>
              <ViewSwitcher 
                currentView={currentView} 
                onViewChange={handleViewChange}
                urlCount={urls.length}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
              />
              
              <div 
                className="transition-all duration-300 ease-in-out" 
                role="region" 
                aria-label={`Sitemap ${currentView} view`}
                aria-live="polite"
              >
                {currentView === 'explorer' && (
                  <div className="animate-fade-in">
                    <ExplorerView data={treeData} searchQuery={searchQuery} />
                  </div>
                )}
                {currentView === 'columns' && (
                  <div className="animate-fade-in">
                    <ColumnsView data={treeData} searchQuery={searchQuery} />
                  </div>
                )}
                {currentView === 'graph' && (
                  <div className="animate-fade-in">
                    <GraphView data={treeData} searchQuery={searchQuery} />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {isLoading && (
          <div className={`transition-all duration-700 ease-in-out ${
            isVisualisationMode 
              ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-2xl px-4'
              : 'mt-12'
          }`} role="status" aria-live="polite">
            <ProgressBar 
              progress={progress} 
              message={progressMessage} 
              subMessage={progressSubMessage} 
            />
          </div>
        )}
        
        {!isLoading && !treeData && !error && !isVisualisationMode && (
          <section className="mt-16 animate-fade-in" aria-label="Getting started">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Ready to explore</h2>
              <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
                Enter a website URL above to explore its structure with our interactive tools.
              </p>
            </div>
          </section>
        )}
      </main>

      {!isVisualisationMode && (
        <footer className="mt-24 py-12 bg-white border-t border-gray-100" role="contentinfo">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <div className="w-8 h-8 bg-blue rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-gray-900">Sitemap Visualiser</p>
                </div>
                <p className="text-base text-gray-600">Professional website structure analysis made simple</p>
              </div>
              <div className="mt-6 md:mt-0 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                <div className="bg-success-500 text-white px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">Accessible Design</span>
                </div>
                <div className="bg-blue text-white px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">WCAG 2.1 AA</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;