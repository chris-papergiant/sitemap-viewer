import { useState, useRef, useEffect } from 'react';
import SitemapFetcher from './components/SitemapFetcher';
import SitemapStats from './components/SitemapStats';
import ProgressBar from './components/ProgressBar';
import ViewSwitcher, { ViewType } from './components/ViewSwitcher';
import ExplorerView from './components/views/ExplorerView';
import ColumnsView from './components/views/ColumnsView';
import GraphView from './components/views/GraphView';
import { Button } from './components/ui/Button';
import Logo from './components/Logo';
import { fetchSitemap, parseSitemapXML, SitemapEntry } from './utils/sitemapParser';
import { buildTreeFromUrls, TreeNode } from './utils/treeBuilder';
import { exportTreeToCSV } from './utils/csvExporter';
import ProgressiveCrawler, { CrawlState } from './utils/progressiveCrawler';
import { Download, AlertCircle, Play, Pause, Square } from 'lucide-react';

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
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlState, setCrawlState] = useState<CrawlState | null>(null);
  const [showCrawlOption, setShowCrawlOption] = useState(false);
  const crawlerRef = useRef<ProgressiveCrawler | null>(null);
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
      setShowCrawlOption(true); // Show crawl option when sitemap fails
      setCurrentUrl(url); // Store URL for potential crawling
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

  const handleStartCrawl = async (url: string) => {
    setError(null);
    setShowCrawlOption(false);
    setIsCrawling(true);
    setIsVisualisationMode(true);
    setCurrentUrl(url);
    
    // Initialize crawler
    crawlerRef.current = new ProgressiveCrawler((state) => {
      setCrawlState(state);
      setTreeData(state.tree);
      
      // Convert discovered URLs to SitemapEntry format for stats
      const mockUrls: SitemapEntry[] = Array.from(state.discovered).map(url => ({
        loc: url
      }));
      setUrls(mockUrls);
      
      // Update progress messages
      setProgressMessage(`Discovering site structure...`);
      setProgressSubMessage(`${state.stats.pagesFound} pages found, ${state.stats.pagesProcessed} processed`);
      
      // If crawling is complete or errored, update UI
      if (state.status === 'complete' || state.status === 'error') {
        setIsCrawling(false);
        if (state.status === 'complete') {
          setError(null); // Clear any previous errors
        }
      }
    });
    
    try {
      await crawlerRef.current.startCrawl(url);
    } catch (error) {
      console.error('Crawl error:', error);
      setError('Failed to crawl website. The site may be blocking automated access, or CORS proxies may be unavailable. Please check the browser console for details.');
      setIsCrawling(false);
      setShowCrawlOption(false);
    }
  };

  const handlePauseCrawl = () => {
    crawlerRef.current?.pause();
  };

  const handleResumeCrawl = () => {
    crawlerRef.current?.resume();
  };

  const handleStopCrawl = () => {
    crawlerRef.current?.stop();
    setIsCrawling(false);
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
    <div className="min-h-screen bg-white">
      {/* Skip Navigation for Screen Readers */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      
      {!isVisualisationMode && (
        <header 
          className="section-primary border-b border-neutral-100"
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-content-h py-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-6 text-primary-pink border border-gray-200">
                <Logo size="large" />
              </div>
              <h1 className="text-display font-serif mb-4">
                Visualise your website
              </h1>
              <p className="text-body-large text-neutral-700 max-w-3xl">
                Enter a website URL to view its sitemap. We'll show you all the pages and how they're organised.
              </p>
            </div>
          </div>
        </header>
      )}

      <main 
        id="main-content" 
        className="transition-all duration-700 ease-in-out" 
        role="main"
        tabIndex={-1}
      >
        {!isVisualisationMode && (
          <section className="section section-secondary">
            <div className="max-w-7xl mx-auto text-center">
              <div className="max-w-4xl mx-auto">
                <SitemapFetcher onFetch={handleFetchSitemap} isLoading={isLoading} />
              </div>
            </div>
          </section>
        )}
        
        {error && (
          <section 
            className={`animate-slide-up ${
              isVisualisationMode 
                ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
                : 'section section-primary'
            }`} 
            role="alert" 
            aria-live="polite"
            aria-atomic="true"
          >
            <div className={isVisualisationMode ? 'max-w-2xl mx-auto px-4' : 'max-w-4xl mx-auto'}>
              <div className="card-elevated p-8 border-l-4 border-l-error relative">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="bg-error text-white p-3 rounded-lg">
                      <svg 
                        className="h-6 w-6" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-card-title font-serif text-error mb-4">
                      No sitemap available
                    </h3>
                    <div className="card-minimal p-4 bg-error-50 border border-error-200">
                      <p className="text-body text-error-600 font-semibold mb-2">This website doesn't have a sitemap we can access</p>
                      <p className="text-sm text-error-600">{error}</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-neutral-700 font-body">
                        <strong>What you can do:</strong>
                      </p>
                      <ul className="text-sm text-neutral-600 font-body space-y-1 ml-4">
                        <li>• Check if the website URL is correct</li>
                        <li>• Try adding or removing 'www' from the URL</li>
                        <li>• Some websites block automated access to their sitemaps</li>
                        <li>• The website may not have a public sitemap.xml file</li>
                      </ul>
                    </div>
                    
                    {showCrawlOption && !isCrawling && (
                      <div className="mt-6 p-4 bg-primary-pink/5 rounded-lg border border-primary-pink/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-primary-pink mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              Alternative: Crawl the website
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              We can try to discover pages by crawling the website directly. This will take longer but may work when sitemaps aren't available.
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              Note: Some websites block crawling. Government sites (.gov.au) may have additional restrictions.
                            </p>
                            <button
                              onClick={() => handleStartCrawl(currentUrl)}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-pink text-white rounded-lg hover:bg-primary-pink/90 transition-colors text-sm font-medium"
                              style={{
                                backgroundColor: '#DB1B5C',
                                color: '#ffffff'
                              }}
                            >
                              <Play className="w-4 h-4" style={{ color: '#ffffff' }} />
                              <span style={{ color: '#ffffff', opacity: 1 }}>Start Website Crawl</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isVisualisationMode && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsVisualisationMode(false);
                          setTreeData(null);
                          setUrls([]);
                          setCurrentUrl('');
                          setSearchQuery('');
                          setError(null);
                          setShowCrawlOption(false);
                        }}
                        className="mt-6"
                      >
                        Try Another Website
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {treeData && urls.length > 0 && (
          <>
            {/* Visualization Section */}
            <section 
              className={`transition-all duration-1000 ease-in-out ${
                isVisualisationMode 
                  ? 'fixed inset-0 z-50 bg-white overflow-auto'
                  : 'section section-primary animate-fade-in'
              }`} 
              aria-label="Sitemap visualisation"
            >
            {/* Visualization mode header - Paper Giant Style */}
            {isVisualisationMode && (
              <div className="sticky top-0 z-50 bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-primary-pink">
                      <Logo size="small" />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsVisualisationMode(false);
                        setTreeData(null);
                        setUrls([]);
                        setCurrentUrl('');
                        setSearchQuery('');
                      }}
                      iconLeft={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      }
                      aria-label="Exit fullscreen visualisation"
                    >
                      Back
                    </Button>
                  </div>
                  
                  <h2 className="text-card-title font-serif absolute left-1/2 transform -translate-x-1/2">
                    {currentUrl ? (currentUrl.includes('://') ? new URL(currentUrl).hostname : currentUrl) : 'Sitemap Analysis'}
                  </h2>
                  
                  <div className="flex items-center gap-3">
                    {/* Crawl status and controls */}
                    {isCrawling && crawlState && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-pink/10 rounded-lg">
                          <div className="w-2 h-2 bg-primary-pink rounded-full animate-pulse" />
                          <span className="text-xs font-medium text-gray-700">
                            Crawling: {crawlState.stats.pagesFound} pages found
                          </span>
                        </div>
                        
                        {crawlState.status === 'crawling' ? (
                          <button
                            onClick={handlePauseCrawl}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Pause crawling"
                          >
                            <Pause className="w-4 h-4 text-gray-600" />
                          </button>
                        ) : crawlState.status === 'paused' ? (
                          <button
                            onClick={handleResumeCrawl}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Resume crawling"
                          >
                            <Play className="w-4 h-4 text-gray-600" />
                          </button>
                        ) : null}
                        
                        <button
                          onClick={handleStopCrawl}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Stop crawling"
                        >
                          <Square className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    )}
                    
                    {/* Download CSV button */}
                    <button
                    onClick={() => {
                      if (treeData) {
                        let siteName = 'sitemap';
                        try {
                          if (currentUrl && currentUrl.includes('://')) {
                            siteName = new URL(currentUrl).hostname;
                          } else if (currentUrl) {
                            siteName = currentUrl.replace(/[^a-z0-9]/gi, '_');
                          }
                        } catch (e) {
                          siteName = 'sitemap';
                        }
                        exportTreeToCSV(treeData, siteName);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#DB1B5C',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    aria-label="Download sitemap as CSV"
                  >
                    <Download className="w-4 h-4" style={{ color: '#ffffff' }} />
                    <span style={{ color: '#ffffff', opacity: 1 }}>Download as CSV</span>
                  </button>
                  </div>
                </div>
                
                {/* Crawling progress bar */}
                {isCrawling && crawlState && (
                  <div className="bg-primary-pink/5 border-b border-primary-pink/20 px-6 py-3">
                    <div className="max-w-7xl mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-gray-700">
                            Discovering site structure...
                          </span>
                          <span className="text-gray-600">
                            {crawlState.stats.pagesProcessed} / {crawlState.stats.pagesFound} pages processed
                          </span>
                          <span className="text-gray-500">
                            Depth: {crawlState.stats.currentDepth}
                          </span>
                        </div>
                        {crawlState.stats.failedPages.length > 0 && (
                          <span className="text-xs text-red-600">
                            {crawlState.stats.failedPages.length} pages failed
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-primary-pink h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, (crawlState.stats.pagesProcessed / Math.max(1, crawlState.stats.estimatedTotal)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!isVisualisationMode && (
              <div className="max-w-7xl mx-auto mb-12 text-center">
                <h3 className="text-card-title font-serif mb-6">Visualisation Tools</h3>
                <div className="border-b border-neutral-200 w-16 mb-8 mx-auto"></div>
              </div>
            )}
            
            
            {/* Stats Section - Shown in both modes */}
            {isVisualisationMode && (
              <div className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Site Overview
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Key metrics and insights from your website's structure
                    </p>
                  </div>
                  <SitemapStats treeData={treeData} urls={urls} />
                </div>
              </div>
            )}
            
            {/* Connected view switcher and visualisation container */}
            <div className={`${
              isVisualisationMode 
                ? 'max-w-7xl mx-auto px-6 py-8' 
                : 'card overflow-hidden max-w-7xl mx-auto'
            }`}>
              <div className={isVisualisationMode ? 'card overflow-hidden' : ''}>
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
            </div>
            </section>
            
            {/* Stats Section - Only show in non-visualization mode */}
            {!isVisualisationMode && (
              <section className="bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Site Overview
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Key metrics and insights from your website's structure
                    </p>
                  </div>
                  <SitemapStats treeData={treeData} urls={urls} />
                </div>
              </section>
            )}
          </>
        )}

        {isLoading && (
          <section 
            className={`transition-all duration-700 ease-in-out ${
              isVisualisationMode 
                ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
                : 'section section-quaternary'
            }`} 
            role="status" 
            aria-live="polite"
          >
            <div className={isVisualisationMode ? 'max-w-2xl mx-auto px-4' : 'max-w-4xl mx-auto'}>
              <ProgressBar 
                progress={progress} 
                message={progressMessage} 
                subMessage={progressSubMessage} 
              />
            </div>
          </section>
        )}
        
      </main>

      {/* Footer - Show in both modes but different styling */}
      <footer className={`${
        isVisualisationMode 
          ? 'bg-gray-900 text-white py-12 mt-auto' 
          : 'section section-tertiary'
      }`} role="contentinfo">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <Logo size="normal" className="text-white" />
                <h3 className="text-card-title font-serif text-white">Sitemap Visualiser</h3>
              </div>
              <p className="text-body text-white text-opacity-80 leading-relaxed max-w-2xl">
                View and explore your website's sitemap structure with interactive visualisations.
              </p>
            </div>
            
            <div className="border-t border-white border-opacity-20 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <p className="text-body text-white text-opacity-60 text-center md:text-left">
                  © {new Date().getFullYear()}
                </p>
                <p className="text-sm text-white text-opacity-60 mt-4 md:mt-0">
                  Built by <a href="https://papergiant.net" target="_blank" rel="noopener noreferrer" className="text-white text-opacity-80 hover:text-opacity-100 border-b border-white border-opacity-40 hover:border-opacity-100 transition-all">Paper Giant</a>
                </p>
              </div>
            </div>
          </div>
        </footer>
    </div>
  );
}

export default App;