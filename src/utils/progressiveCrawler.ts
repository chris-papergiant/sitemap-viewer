import { TreeNode } from './treeBuilder';

// CORS proxy configuration - using multiple proxies as fallbacks
// Note: Some proxies work better with certain sites
// Unfortunately, many government sites block most CORS proxies
const CORS_PROXIES = [
  'https://corsproxy.io/?',  
  'https://proxy.cors.sh/',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors-anywhere.herokuapp.com/'
];

export interface CrawlStats {
  pagesFound: number;
  pagesProcessed: number;
  currentDepth: number;
  estimatedTotal: number;
  startTime: number;
  failedPages: string[];
}

export interface CrawlTask {
  url: string;
  depth: number;
  parentPath: string[];
  priority: number;
}

export interface CrawlState {
  discovered: Set<string>;
  queue: CrawlTask[];
  tree: TreeNode;
  status: 'idle' | 'crawling' | 'paused' | 'complete' | 'error';
  stats: CrawlStats;
}

export type CrawlProgressCallback = (state: CrawlState) => void;

class ProgressiveCrawler {
  private state: CrawlState;
  private onProgress: CrawlProgressCallback;
  private abortController: AbortController | null = null;
  private batchSize = 3; // Reduced for government sites
  private maxDepth = 3;
  private maxPages = 500;
  private crawlDelay = 1000; // Increased delay for government sites (1s between batches)
  private baseUrl: string = '';
  private baseDomain: string = '';
  private debugMode = true; // Enable detailed logging
  private requestCount = 0;

  constructor(onProgress: CrawlProgressCallback) {
    this.onProgress = onProgress;
    this.state = this.createInitialState();
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toISOString().split('T')[1];
    const prefix = `[CRAWLER ${timestamp}]`;
    
    switch (level) {
      case 'info':
        console.log(`%c${prefix} ${message}`, 'color: #0066cc', data || '');
        break;
      case 'warn':
        console.warn(`%c${prefix} ${message}`, 'color: #ff9900', data || '');
        break;
      case 'error':
        console.error(`%c${prefix} ${message}`, 'color: #ff0000', data || '');
        break;
      case 'debug':
        console.log(`%c${prefix} ${message}`, 'color: #666666', data || '');
        break;
    }
  }

  private createInitialState(): CrawlState {
    return {
      discovered: new Set<string>(),
      queue: [],
      tree: { name: 'Loading...', path: '/', children: [] },
      status: 'idle',
      stats: {
        pagesFound: 0,
        pagesProcessed: 0,
        currentDepth: 0,
        estimatedTotal: 0,
        startTime: Date.now(),
        failedPages: []
      }
    };
  }

  async startCrawl(url: string, maxDepth = 3, maxPages = 500): Promise<void> {
    console.group('%c🚀 CRAWLER START', 'color: #ff1493; font-weight: bold');
    
    this.maxDepth = maxDepth;
    this.maxPages = maxPages;
    this.state = this.createInitialState();
    this.abortController = new AbortController();

    this.log('info', `Configuration:`, {
      maxDepth,
      maxPages,
      batchSize: this.batchSize,
      crawlDelay: this.crawlDelay,
      inputUrl: url
    });

    // Parse and normalize the URL
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      this.baseUrl = parsedUrl.origin;
      this.baseDomain = parsedUrl.hostname;
      
      this.log('info', `Parsed URL:`, {
        baseUrl: this.baseUrl,
        baseDomain: this.baseDomain,
        fullUrl: parsedUrl.href
      });
      
      // Initialize tree with domain name
      this.state.tree = {
        name: this.baseDomain,
        path: '/',
        children: [],
        data: { loc: this.baseUrl }
      };
      
      this.log('debug', 'Initial tree created:', this.state.tree);
      
      // Add homepage to queue
      this.addToQueue(this.baseUrl, 0, []);
      this.log('info', `Homepage added to queue: ${this.baseUrl}`);
      
      // Start crawling
      this.state.status = 'crawling';
      this.state.stats.startTime = Date.now();
      this.onProgress(this.state);
      
      this.log('info', '🏃 Starting crawl loop...');
      
      // Start the crawl loop
      await this.crawlLoop();
      
      console.groupEnd();
    } catch (error) {
      this.log('error', 'Crawl start failed:', error);
      this.state.status = 'error';
      this.onProgress(this.state);
      console.groupEnd();
      throw error;
    }
  }

  private async crawlLoop(): Promise<void> {
    let batchCount = 0;
    
    while (
      this.state.queue.length > 0 && 
      this.state.status === 'crawling' &&
      this.state.stats.pagesProcessed < this.maxPages
    ) {
      batchCount++;
      console.group(`%c📦 Batch #${batchCount}`, 'color: #0099cc');
      
      // Get next batch
      const batch = this.state.queue
        .sort((a, b) => a.priority - b.priority)
        .slice(0, this.batchSize);
      
      this.log('info', `Processing batch of ${batch.length} URLs:`, 
        batch.map(t => ({ url: t.url, depth: t.depth, priority: t.priority }))
      );
      
      this.state.queue = this.state.queue.slice(this.batchSize);
      this.log('debug', `Remaining in queue: ${this.state.queue.length}`);
      
      // Process batch in parallel
      const startTime = Date.now();
      const promises = batch.map(task => this.processPage(task));
      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;
      
      this.log('info', `Batch complete in ${Date.now() - startTime}ms:`, {
        success: successCount,
        failed: failCount,
        totalProcessed: this.state.stats.pagesProcessed,
        totalFound: this.state.stats.pagesFound
      });
      
      console.groupEnd();
      
      // Update progress
      this.onProgress(this.state);
      
      // Delay between batches to avoid rate limiting
      if (this.state.queue.length > 0) {
        this.log('debug', `Waiting ${this.crawlDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.crawlDelay));
      }
    }
    
    // Mark as complete
    if (this.state.status === 'crawling') {
      this.state.status = 'complete';
      this.log('info', '✅ Crawl complete!', {
        totalPages: this.state.stats.pagesFound,
        processed: this.state.stats.pagesProcessed,
        failed: this.state.stats.failedPages.length,
        duration: `${(Date.now() - this.state.stats.startTime) / 1000}s`
      });
      this.onProgress(this.state);
    }
  }

  private async fetchWithProxy(url: string): Promise<string> {
    this.requestCount++;
    console.group(`%c🌐 Request #${this.requestCount}: Fetching ${url}`, 'color: #4CAF50');
    
    let lastError: Error | null = null;
    let proxyAttempt = 0;
    
    for (const proxy of CORS_PROXIES) {
      proxyAttempt++;
      const proxyName = proxy.includes('corsproxy.io') ? 'corsproxy.io' :
                       proxy.includes('cors.sh') ? 'cors.sh' :
                       proxy.includes('codetabs') ? 'codetabs' :
                       proxy.includes('thingproxy') ? 'thingproxy' :
                       proxy.includes('herokuapp') ? 'cors-anywhere' : 'unknown';
      
      console.group(`%c🔄 Proxy Attempt ${proxyAttempt}/${CORS_PROXIES.length}: ${proxyName}`, 'color: #2196F3');
      
      try {
        const proxyUrl = (proxy.includes('quest=') || 
                          proxy.includes('corsproxy.io')) ? 
          proxy + encodeURIComponent(url) : 
          proxy + url;
        
        this.log('debug', `Full proxy URL:`, proxyUrl);
        this.log('info', `Fetching with headers:`, {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        });
        
        const startTime = Date.now();
        // Different headers for different proxies
        const headers: HeadersInit = proxy.includes('allorigins') ? 
          {} : // AllOrigins doesn't need special headers
          {
            'Accept': 'text/html',
            'X-Requested-With': 'XMLHttpRequest' // Required for some proxies
          };
        
        const response = await fetch(proxyUrl, {
          signal: this.abortController?.signal,
          headers,
          mode: 'cors'
        });
        
        const fetchTime = Date.now() - startTime;
        
        this.log('info', `Response received in ${fetchTime}ms:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          ok: response.ok
        });
        
        if (!response.ok) {
          const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            url: proxyUrl
          };
          this.log('warn', `HTTP error from ${proxyName}:`, errorDetails);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        this.log('info', `✅ Success with ${proxyName}!`, {
          htmlLength: html.length,
          fetchTimeMs: fetchTime,
          firstChars: html.substring(0, 100)
        });
        
        console.groupEnd(); // End proxy attempt
        console.groupEnd(); // End request
        return html;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorDetails = {
          proxy: proxyName,
          error: errorMessage,
          type: error instanceof TypeError ? 'Network/CORS Error' : 'Other Error'
        };
        
        this.log('error', `❌ Failed with ${proxyName}:`, errorDetails);
        
        if (error instanceof Error && error.message.includes('aborted')) {
          this.log('warn', 'Request was aborted by user');
          console.groupEnd(); // End proxy attempt
          console.groupEnd(); // End request
          throw error;
        }
        
        lastError = error as Error;
        console.groupEnd(); // End proxy attempt
        continue; // Try next proxy
      }
    }
    
    this.log('error', '❌ ALL PROXIES FAILED', {
      url,
      attempts: proxyAttempt,
      lastError: lastError?.message
    });
    
    console.groupEnd(); // End request
    
    // Provide a more descriptive error based on the failure type
    if (lastError?.message.includes('403') || lastError?.message.includes('Forbidden')) {
      throw new Error('All proxies failed - Website is blocking automated crawlers (403 Forbidden)');
    } else if (lastError?.message.includes('Failed to fetch')) {
      throw new Error('All proxies failed - Network error or site blocking access');
    } else {
      throw new Error(`All proxies failed - ${lastError?.message || 'Unknown error'}`);
    }
  }

  private async processPage(task: CrawlTask): Promise<void> {
    if (this.state.discovered.has(task.url)) {
      this.log('debug', `Skipping already discovered URL: ${task.url}`);
      return;
    }
    
    console.group(`%c📄 Processing Page: ${task.url}`, 'color: #9C27B0');
    this.log('info', 'Task details:', {
      depth: task.depth,
      priority: task.priority,
      parentPath: task.parentPath,
      maxDepth: this.maxDepth,
      discovered: this.state.discovered.size,
      processed: this.state.stats.pagesProcessed
    });
    
    this.state.discovered.add(task.url);
    this.state.stats.pagesProcessed++;
    
    try {
      // Fetch the page through CORS proxy
      this.log('info', '🔍 Fetching page content...');
      const fetchStart = Date.now();
      const html = await this.fetchWithProxy(task.url);
      const fetchTime = Date.now() - fetchStart;
      
      this.log('info', `✅ Page fetched successfully`, {
        fetchTimeMs: fetchTime,
        htmlLength: html.length,
        hasContent: html.length > 0
      });
      
      // Parse links from HTML
      this.log('info', '🔗 Extracting links from HTML...');
      const extractStart = Date.now();
      const links = this.extractLinks(html, task.url);
      const extractTime = Date.now() - extractStart;
      
      this.log('info', `Found ${links.length} links`, {
        extractTimeMs: extractTime,
        links: links.slice(0, 10), // Show first 10 links
        totalLinks: links.length
      });
      
      // Add page to tree
      this.log('debug', '🌳 Adding page to tree structure...');
      this.addToTree(task.url, task.parentPath);
      
      // Queue new links if within depth limit
      if (task.depth < this.maxDepth) {
        let queuedCount = 0;
        let skippedCount = 0;
        
        links.forEach(link => {
          if (!this.state.discovered.has(link) && this.state.stats.pagesFound < this.maxPages) {
            const newPath = [...task.parentPath, this.getPageName(task.url)];
            this.addToQueue(link, task.depth + 1, newPath);
            queuedCount++;
          } else {
            skippedCount++;
          }
        });
        
        this.log('info', `📋 Queued ${queuedCount} new links`, {
          skipped: skippedCount,
          reason: skippedCount > 0 ? 'Already discovered or max pages reached' : 'None',
          currentQueueSize: this.state.queue.length,
          depth: task.depth + 1
        });
      } else {
        this.log('warn', `⚠️ Max depth reached (${this.maxDepth}), not queuing child links`);
      }
      
      // Update current depth
      this.state.stats.currentDepth = Math.max(this.state.stats.currentDepth, task.depth);
      
      // Estimate total pages (rough heuristic)
      if (this.state.stats.pagesProcessed < 10) {
        const oldEstimate = this.state.stats.estimatedTotal;
        this.state.stats.estimatedTotal = Math.min(
          links.length * Math.pow(links.length, this.maxDepth - task.depth),
          this.maxPages
        );
        
        if (oldEstimate !== this.state.stats.estimatedTotal) {
          this.log('debug', `Updated estimated total pages`, {
            old: oldEstimate,
            new: this.state.stats.estimatedTotal,
            calculation: `${links.length} * ${links.length}^${this.maxDepth - task.depth}`
          });
        }
      }
      
      this.log('info', `✅ Page processed successfully`, {
        url: task.url,
        linksFound: links.length,
        totalDiscovered: this.state.discovered.size,
        totalProcessed: this.state.stats.pagesProcessed
      });
      
      console.groupEnd();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `❌ Failed to process page`, {
        url: task.url,
        error: errorMessage,
        depth: task.depth
      });
      
      this.state.stats.failedPages.push(task.url);
      console.groupEnd();
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: Set<string> = new Set();
    const base = new URL(baseUrl);
    
    this.log('debug', `🔍 Extracting links from HTML`, {
      htmlLength: html.length,
      baseUrl: baseUrl,
      baseDomain: this.baseDomain
    });
    
    // Regular expression to find href attributes
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match;
    let totalMatches = 0;
    let skippedLinks = {
      fragments: 0,
      mailto: 0,
      tel: 0,
      javascript: 0,
      files: 0,
      external: 0,
      invalid: 0
    };
    
    while ((match = hrefRegex.exec(html)) !== null) {
      totalMatches++;
      try {
        const href = match[1];
        
        // Skip certain types of links
        if (href.startsWith('#')) {
          skippedLinks.fragments++;
          continue;
        }
        if (href.startsWith('mailto:')) {
          skippedLinks.mailto++;
          continue;
        }
        if (href.startsWith('tel:')) {
          skippedLinks.tel++;
          continue;
        }
        if (href.startsWith('javascript:')) {
          skippedLinks.javascript++;
          continue;
        }
        if (href.includes('.pdf') || href.includes('.jpg') || 
            href.includes('.png') || href.includes('.gif')) {
          skippedLinks.files++;
          continue;
        }
        
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, base).href;
        
        // Only include URLs from the same domain
        const linkUrl = new URL(absoluteUrl);
        if (linkUrl.hostname === this.baseDomain) {
          // Normalize URL (remove fragment and trailing slash)
          const normalized = absoluteUrl.split('#')[0].replace(/\/$/, '');
          if (normalized) {
            links.add(normalized);
          }
        } else {
          skippedLinks.external++;
          this.log('debug', `Skipped external link: ${linkUrl.hostname} != ${this.baseDomain}`);
        }
      } catch (e) {
        skippedLinks.invalid++;
        // Invalid URL, skip it
      }
    }
    
    this.log('debug', `📊 Link extraction complete`, {
      totalHrefMatches: totalMatches,
      validLinks: links.size,
      skipped: skippedLinks,
      sampleLinks: Array.from(links).slice(0, 5)
    });
    
    return Array.from(links);
  }

  private addToQueue(url: string, depth: number, parentPath: string[]): void {
    // Calculate priority (lower is higher priority)
    // Prioritize: homepage (0), shallow pages (depth), then alphabetical
    let priority = depth * 1000;
    if (url === this.baseUrl) {
      priority = 0;
    } else if (depth === 1) {
      // Main navigation likely
      priority = 100;
    }
    
    const task = {
      url,
      depth,
      parentPath,
      priority
    };
    
    this.state.queue.push(task);
    this.state.stats.pagesFound++;
    
    this.log('debug', `➕ Added to queue`, {
      url,
      depth,
      priority,
      queuePosition: this.state.queue.length,
      totalFound: this.state.stats.pagesFound
    });
  }

  private addToTree(url: string, _parentPath: string[]): void {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(s => s);
    
    this.log('debug', `🌳 Adding to tree: ${url}`, {
      pathname: urlObj.pathname,
      segments: pathSegments,
      segmentCount: pathSegments.length
    });
    
    let currentNode = this.state.tree;
    let treePath = '/';
    
    // Navigate to the correct position in the tree
    for (const segment of pathSegments.slice(0, -1)) {
      let child = currentNode.children?.find(c => c.name === segment);
      if (!child) {
        child = {
          name: segment,
          path: `${currentNode.path}${segment}/`,
          children: []
        };
        if (!currentNode.children) {
          currentNode.children = [];
        }
        currentNode.children.push(child);
        this.log('debug', `  Created intermediate node: ${segment}`);
      }
      currentNode = child;
      treePath += `${segment}/`;
    }
    
    // Add the page if it doesn't exist
    const leafName = pathSegments[pathSegments.length - 1] || 'Home';
    const existingNode = currentNode.children?.find(c => c.name === leafName);
    
    if (!existingNode) {
      if (!currentNode.children) {
        currentNode.children = [];
      }
      const newNode = {
        name: leafName,
        path: urlObj.pathname,
        data: { loc: url },
        children: []
      };
      currentNode.children.push(newNode);
      
      this.log('debug', `  ✅ Added leaf node: ${leafName}`, {
        path: urlObj.pathname,
        parentPath: treePath,
        totalChildren: currentNode.children.length
      });
    } else {
      this.log('debug', `  ⏭️ Node already exists: ${leafName}`);
    }
  }

  private getPageName(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      if (path === '/' || path === '') {
        return 'Home';
      }
      
      // Get last segment and clean it up
      const segments = path.split('/').filter(s => s);
      const lastSegment = segments[segments.length - 1] || 'Home';
      
      // Remove file extensions and clean up
      return lastSegment
        .replace(/\.(html?|php|aspx?)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      return 'Page';
    }
  }

  pause(): void {
    if (this.state.status === 'crawling') {
      this.state.status = 'paused';
      this.onProgress(this.state);
    }
  }

  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'crawling';
      this.onProgress(this.state);
      this.crawlLoop();
    }
  }

  stop(): void {
    this.state.status = 'complete';
    this.abortController?.abort();
    this.onProgress(this.state);
  }

  getState(): CrawlState {
    return this.state;
  }

  setMaxDepth(depth: number): void {
    this.maxDepth = depth;
  }

  setMaxPages(pages: number): void {
    this.maxPages = pages;
  }
}

// Debug helpers - expose to window for runtime debugging
if (typeof window !== 'undefined') {
  (window as any).CrawlerDebug = {
    lastCrawler: null as ProgressiveCrawler | null,
    proxies: CORS_PROXIES,
    
    // Test a specific URL with all proxies
    async testProxies(url: string) {
      console.group('%c🧪 Testing all proxies', 'color: #9C27B0; font-weight: bold');
      console.log('Testing URL:', url);
      
      for (const proxy of CORS_PROXIES) {
        const proxyName = proxy.includes('corsproxy.io') ? 'corsproxy.io' :
                         proxy.includes('cors.sh') ? 'cors.sh' :
                         proxy.includes('codetabs') ? 'codetabs' :
                         proxy.includes('thingproxy') ? 'thingproxy' :
                         proxy.includes('herokuapp') ? 'cors-anywhere' : 'unknown';
        
        const proxyUrl = (proxy.includes('quest=') || 
                          proxy.includes('corsproxy.io')) ? 
          proxy + encodeURIComponent(url) : 
          proxy + url;
        
        console.group(`Testing ${proxyName}...`);
        console.log('Proxy URL:', proxyUrl);
        
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'text/html',
              'X-Requested-With': 'XMLHttpRequest'
            },
            mode: 'cors'
          });
          
          console.log(`✅ ${proxyName} SUCCESS:`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          
          if (response.ok) {
            const text = await response.text();
            console.log('Response length:', text.length);
            console.log('First 200 chars:', text.substring(0, 200));
          }
        } catch (error) {
          console.error(`❌ ${proxyName} FAILED:`, error);
        }
        
        console.groupEnd();
      }
      
      console.groupEnd();
    },
    
    // Get current crawler state
    getState() {
      if (this.lastCrawler) {
        const state = this.lastCrawler.getState();
        console.table({
          Status: state.status,
          'Pages Found': state.stats.pagesFound,
          'Pages Processed': state.stats.pagesProcessed,
          'Queue Size': state.queue.length,
          'Discovered URLs': state.discovered.size,
          'Failed Pages': state.stats.failedPages.length,
          'Current Depth': state.stats.currentDepth,
          'Estimated Total': state.stats.estimatedTotal
        });
        return state;
      }
      console.log('No crawler instance available');
      return null;
    },
    
    // Get failed pages
    getFailedPages() {
      if (this.lastCrawler) {
        const state = this.lastCrawler.getState();
        if (state.stats.failedPages.length > 0) {
          console.log('Failed pages:');
          state.stats.failedPages.forEach((url: string, i: number) => {
            console.log(`${i + 1}. ${url}`);
          });
          return state.stats.failedPages;
        }
        console.log('No failed pages');
        return [];
      }
      console.log('No crawler instance available');
      return null;
    },
    
    // Manual crawl test
    async testCrawl(url: string, maxDepth = 2, maxPages = 10) {
      console.group('%c🧪 Test Crawl', 'color: #FF6B35; font-weight: bold');
      console.log('Configuration:', { url, maxDepth, maxPages });
      
      const testCrawler = new ProgressiveCrawler((state) => {
        console.log('State update:', {
          status: state.status,
          found: state.stats.pagesFound,
          processed: state.stats.pagesProcessed,
          queue: state.queue.length
        });
      });
      
      this.lastCrawler = testCrawler;
      
      try {
        await testCrawler.startCrawl(url, maxDepth, maxPages);
        console.log('✅ Test crawl completed');
        return testCrawler.getState();
      } catch (error) {
        console.error('❌ Test crawl failed:', error);
        return null;
      } finally {
        console.groupEnd();
      }
    },
    
    help() {
      console.log('%c🔧 Crawler Debug Commands', 'color: #2196F3; font-weight: bold; font-size: 14px');
      console.log('\nAvailable commands:');
      console.log('  CrawlerDebug.testProxies(url)     - Test all CORS proxies with a URL');
      console.log('  CrawlerDebug.getState()           - Get current crawler state');
      console.log('  CrawlerDebug.getFailedPages()     - List all failed pages');
      console.log('  CrawlerDebug.testCrawl(url, depth, pages) - Run a test crawl');
      console.log('  CrawlerDebug.help()               - Show this help message');
      console.log('\nExample:');
      console.log("  CrawlerDebug.testProxies('https://vichealth.vic.gov.au')");
      console.log("  CrawlerDebug.testCrawl('https://example.com', 2, 10)");
    }
  };
  
  // Store reference to last created crawler
  const OriginalCrawler = ProgressiveCrawler;
  (ProgressiveCrawler as any) = class extends OriginalCrawler {
    constructor(onProgress: CrawlProgressCallback) {
      super(onProgress);
      (window as any).CrawlerDebug.lastCrawler = this;
      console.log('%c📌 Crawler instance created and stored in CrawlerDebug.lastCrawler', 'color: #4CAF50');
    }
  };
  
  console.log('%c🔧 Crawler Debug Tools Loaded!', 'color: #2196F3; font-weight: bold');
  console.log('Type CrawlerDebug.help() for available commands');
}

export default ProgressiveCrawler;