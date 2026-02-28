import { useState, useRef, useEffect } from 'react';
import { track } from '@vercel/analytics';
import SitemapFetcher from './components/SitemapFetcher';
import SitemapStats from './components/SitemapStats';
import ProgressBar from './components/ProgressBar';
import ViewSwitcher, { ViewType } from './components/ViewSwitcher';
import ExplorerView from './components/views/ExplorerView';
import ColumnsView from './components/views/ColumnsView';
import GraphView from './components/views/GraphView';
import { Button } from './components/ui/Button';
import Logo from './components/Logo';
import StructuralInsights from './components/StructuralInsights';
import { fetchSitemap, parseSitemapXML, SitemapEntry } from './utils/sitemapParser';
import { buildTreeFromUrls, TreeNode } from './utils/treeBuilder';
import { exportTreeToCSV } from './utils/csvExporter';
import ProgressiveCrawler, { CrawlState } from './utils/progressiveCrawler';
import { Download, Play, Pause, Square, FileJson, Link, Check, ShieldCheck } from 'lucide-react';
import { exportJSON, copyShareLink } from './utils/exportUtils';
import { verifySitemapUrls, VerificationReport } from './utils/sitemapVerifier';

// URL parameter utilities for shareable links
const updateUrlParams = (url: string, view: ViewType, search?: string) => {
  const params = new URLSearchParams();
  params.set('url', encodeURIComponent(url));
  params.set('view', view);
  if (search) {
    params.set('search', encodeURIComponent(search));
  }

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    url: params.get('url') ? decodeURIComponent(params.get('url')!) : null,
    view: (params.get('view') as ViewType) || 'explorer',
    search: params.get('search') ? decodeURIComponent(params.get('search')!) : ''
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const crawlerRef = useRef<ProgressiveCrawler | null>(null);
  const isCompleteRef = useRef(false);

  const getSiteName = () => {
    try {
      if (currentUrl && currentUrl.includes('://')) {
        return new URL(currentUrl).hostname;
      } else if (currentUrl) {
        return currentUrl.replace(/[^a-z0-9]/gi, '_');
      }
    } catch {
      // fall through
    }
    return 'sitemap';
  };

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
    setVerificationReport(null);
    isCompleteRef.current = false;

    // Track sitemap search event
    track('sitemap_search', {
      url: url,
      domain: url.includes('://') ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : url,
      timestamp: new Date().toISOString()
    });

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
          
          // Track successful sitemap fetch
          track('sitemap_success', {
            domain: new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
            urlCount: allUrls.length,
            type: 'sitemap_index'
          });
          
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
        
        // Track successful sitemap fetch
        track('sitemap_success', {
          domain: new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
          urlCount: parsed.urls.length,
          type: 'sitemap'
        });
        
        // Update URL parameters for sharing
        updateUrlParams(url, currentView);
      } else {
        setError('No URLs found in the sitemap. The sitemap might be empty or in an unsupported format.');
      }
    } catch (err) {
      console.error('Error during sitemap fetch:', err);
      
      // Track sitemap failure
      track('sitemap_failed', {
        domain: url.includes('://') ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : url,
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'sitemap'
      });
      
      // Automatically start crawling when sitemap is not found
      console.log('Sitemap not found, automatically starting crawler...');
      setIsLoading(false); // Stop the sitemap loading state
      setProgress(0);
      handleStartCrawl(url); // Automatically start crawling
      return; // Exit early since we're starting the crawler
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
    console.group('%c🚀 APP: Starting Crawl', 'color: #FF6B6B; font-weight: bold; font-size: 14px');
    console.log('Input URL:', url);
    console.log('Current state:', {
      error,
      isCrawling,
      isVisualisationMode,
      treeData: treeData ? 'exists' : 'null'
    });
    
    // Track crawler start event
    track('crawler_started', {
      domain: url.includes('://') ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : url,
      timestamp: new Date().toISOString()
    });
    
    setError(null);
    setIsCrawling(true);
    setIsVisualisationMode(true);
    setCurrentUrl(url);
    setVerificationReport(null);
    
    // Initialize crawler with detailed logging
    console.log('%c📊 Initializing crawler with callback...', 'color: #4ECDC4');
    let callbackCount = 0;
    
    crawlerRef.current = new ProgressiveCrawler((state) => {
      callbackCount++;
      console.log(`%c📨 Callback #${callbackCount}`, 'color: #95E77E', {
        status: state.status,
        discovered: state.discovered.size,
        queue: state.queue.length,
        processed: state.stats.pagesProcessed,
        found: state.stats.pagesFound,
        failed: state.stats.failedPages.length,
        tree: state.tree ? `${state.tree.name} with ${state.tree.children?.length || 0} children` : 'null'
      });
      
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
        console.log(`%c🏁 Crawl ${state.status}`, state.status === 'complete' ? 'color: #52C41A' : 'color: #FF4D4F', {
          totalDiscovered: state.discovered.size,
          totalProcessed: state.stats.pagesProcessed,
          totalFailed: state.stats.failedPages.length,
          duration: `${(Date.now() - state.stats.startTime) / 1000}s`
        });
        setIsCrawling(false);
        if (state.status === 'complete') {
          setError(null); // Clear any previous errors
          
          // Track successful crawl
          track('crawler_success', {
            domain: url.includes('://') ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : url,
            pagesDiscovered: state.discovered.size,
            pagesProcessed: state.stats.pagesProcessed,
            duration: Math.round((Date.now() - state.stats.startTime) / 1000)
          });
        }
      }
    });
    
    try {
      console.log('%c🏃 Starting crawl...', 'color: #FFA500');
      await crawlerRef.current.startCrawl(url);
      console.log('%c✅ Crawl started successfully', 'color: #52C41A');
    } catch (error) {
      console.error('%c❌ Crawl error:', 'color: #FF4D4F', error);
      console.log('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Determine the type of error for better messaging
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      let userMessage = '';
      
      if (errorMessage.includes('all proxies failed') || errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        userMessage = 'This website is blocking automated crawlers. The site has security measures that prevent browser-based tools from accessing it. This is common for government sites and some corporate websites.';
      } else if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
        userMessage = 'Unable to connect to the website. The site may be temporarily unavailable or blocking automated access.';
      } else {
        userMessage = 'Failed to crawl website. The site may be blocking automated access, or CORS proxies may be unavailable.';
      }
      
      setError(userMessage);
      setIsCrawling(false);
      
      // Track crawler failure
      track('crawler_failed', {
        domain: url.includes('://') ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : url,
        error: errorMessage,
        type: errorMessage.includes('403') ? 'blocked' : 'network'
      });
    } finally {
      console.groupEnd();
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

  const handleVerifyUrls = async () => {
    if (isVerifying || !urls.length) return;
    setIsVerifying(true);
    setVerificationReport(null);
    try {
      await verifySitemapUrls(urls, 20, (report) => {
        setVerificationReport(report);
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Load from URL parameters on initial load
  useEffect(() => {
    const { url, view, search } = getUrlParams();
    if (url) {
      setCurrentView(view);
      if (search) setSearchQuery(search);
      handleFetchSitemap(url);
    }
  }, []);

  // Handle view changes and update URL
  const handleViewChange = (view: ViewType) => {
    const previousView = currentView;
    setCurrentView(view);
    
    // Track view change event
    if (treeData && previousView !== view) {
      track('view_changed', {
        from: previousView,
        to: view,
        domain: currentUrl.includes('://') ? new URL(currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`).hostname : currentUrl,
        urlCount: urls.length
      });
    }
    
    if (currentUrl) {
      updateUrlParams(currentUrl, view, searchQuery);
    }
  };

  // Persist search query in URL
  useEffect(() => {
    if (currentUrl && treeData) {
      updateUrlParams(currentUrl, currentView, searchQuery);
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white">
      {/* Skip Navigation for Screen Readers */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      
      {!isVisualisationMode && (
        <header 
          className="section-primary border-b border-neutral-100"
        >
          <div className="max-w-7xl mx-auto px-content-h py-6 text-center">
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
                      No sitemap found
                    </h3>
                    <div className="card-minimal p-4 bg-error-50 border border-error-200">
                      <p className="text-body text-error-600">
                        {currentUrl ? (
                          <>
                            <strong>{currentUrl}</strong> doesn't have a sitemap, or is blocking access to it.
                          </>
                        ) : (
                          'The website doesn\'t have a sitemap, or is blocking access to it.'
                        )}
                      </p>
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
                  
                  <h2 className="text-card-title font-serif absolute left-1/2 transform -translate-x-1/2 pointer-events-none hidden md:block">
                    {currentUrl ? (currentUrl.includes('://') ? new URL(currentUrl).hostname : currentUrl) : 'Sitemap Analysis'}
                  </h2>
                  
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
                    
                    {/* Export & verify buttons */}
                    <button
                      onClick={handleVerifyUrls}
                      className={`hidden sm:flex p-2 border border-gray-300 rounded-lg shadow-sm transition-colors ${
                        isVerifying ? 'bg-amber-50 border-amber-300' : 'bg-white hover:bg-gray-50'
                      }`}
                      title={isVerifying ? 'Verifying...' : 'Verify URLs are accessible'}
                      aria-label="Verify sitemap URLs"
                      disabled={isVerifying}
                    >
                      <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'text-amber-500 animate-pulse' : 'text-gray-600'}`} />
                    </button>
                    <button
                      onClick={async () => {
                        const success = await copyShareLink();
                        if (success) {
                          setLinkCopied(true);
                          track('link_copied', { domain: getSiteName() });
                          setTimeout(() => setLinkCopied(false), 2000);
                        }
                      }}
                      className="hidden sm:flex p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
                      title={linkCopied ? 'Copied!' : 'Copy share link'}
                      aria-label="Copy shareable link"
                    >
                      {linkCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Link className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (treeData) {
                          track('json_downloaded', { domain: getSiteName(), urlCount: urls.length });
                          exportJSON(treeData, urls, getSiteName());
                        }
                      }}
                      className="hidden sm:flex p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
                      title="Download as JSON"
                      aria-label="Download sitemap as JSON"
                    >
                      <FileJson className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (treeData) {
                          const siteName = getSiteName();

                          // Track CSV download event
                          track('csv_downloaded', {
                            domain: siteName,
                            urlCount: urls.length,
                            source: isCrawling ? 'crawler' : 'sitemap',
                            timestamp: new Date().toISOString()
                          });

                          exportTreeToCSV(treeData, siteName);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-pink text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                      aria-label="Download sitemap as CSV"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
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
                    <h2 className="text-card-title font-serif text-gray-900 mb-3">
                      Site Overview
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Key metrics and insights from {currentUrl ? (() => {
                        try {
                          const url = currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`;
                          const domain = new URL(url).hostname;
                          return domain.endsWith('.com') || domain.endsWith('.org') || domain.endsWith('.net') || domain.endsWith('.io') || domain.endsWith('.au') || domain.endsWith('.gov') || domain.endsWith('.edu') 
                            ? `${domain}'s structure`
                            : `the structure of ${domain}`;
                        } catch {
                          return 'your website\'s structure';
                        }
                      })() : 'your website\'s structure'}
                    </p>
                  </div>
                  <SitemapStats treeData={treeData} urls={urls} />
                  <StructuralInsights treeData={treeData} urls={urls} />
                  {verificationReport && (
                    <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-primary-pink/10 rounded-lg">
                          <ShieldCheck className="h-5 w-5 text-primary-pink" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">URL Verification</h3>
                          <p className="text-sm text-gray-500">
                            Checked {verificationReport.checked} of {verificationReport.total} URLs
                            {!verificationReport.isComplete && ' (in progress...)'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-700">{verificationReport.ok}</p>
                          <p className="text-xs text-green-600">Accessible</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-700">{verificationReport.errors}</p>
                          <p className="text-xs text-red-600">Errors</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-lg">
                          <p className="text-2xl font-bold text-amber-700">{verificationReport.redirects}</p>
                          <p className="text-xs text-amber-600">Redirects</p>
                        </div>
                      </div>
                      {(() => {
                        const errorResults = verificationReport.results.filter(r => r.status === 'error');
                        return errorResults.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-red-700">Failed URLs:</p>
                            {errorResults.map((r, i) => (
                              <p key={i} className="text-xs font-mono text-red-600 truncate">{r.url}</p>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
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
                    <GraphView data={treeData} searchQuery={searchQuery} siteName={getSiteName()} />
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
                    <h2 className="text-card-title font-serif text-gray-900 mb-3">
                      Site Overview
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                      Key metrics and insights from {currentUrl ? (() => {
                        try {
                          const url = currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`;
                          const domain = new URL(url).hostname;
                          return domain.endsWith('.com') || domain.endsWith('.org') || domain.endsWith('.net') || domain.endsWith('.io') || domain.endsWith('.au') || domain.endsWith('.gov') || domain.endsWith('.edu')
                            ? `${domain}'s structure`
                            : `the structure of ${domain}`;
                        } catch {
                          return 'your website\'s structure';
                        }
                      })() : 'your website\'s structure'}
                    </p>
                  </div>
                  <SitemapStats treeData={treeData} urls={urls} />
                  <StructuralInsights treeData={treeData} urls={urls} />
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
      }`}>
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