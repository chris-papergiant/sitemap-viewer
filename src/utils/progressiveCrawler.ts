import { TreeNode } from './treeBuilder';

// CORS proxy configuration - using multiple proxies as fallbacks
const CORS_PROXIES = [
  'https://proxy.cors.sh/',
  'https://api.codetabs.com/v1/proxy?quest=',
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
  private batchSize = 5;
  private maxDepth = 3;
  private maxPages = 500;
  private crawlDelay = 500; // ms between batches
  private baseUrl: string = '';
  private baseDomain: string = '';

  constructor(onProgress: CrawlProgressCallback) {
    this.onProgress = onProgress;
    this.state = this.createInitialState();
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
    this.maxDepth = maxDepth;
    this.maxPages = maxPages;
    this.state = this.createInitialState();
    this.abortController = new AbortController();

    // Parse and normalize the URL
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      this.baseUrl = parsedUrl.origin;
      this.baseDomain = parsedUrl.hostname;
      
      console.log('Starting crawl for:', this.baseUrl, 'Domain:', this.baseDomain);
      
      // Initialize tree with domain name
      this.state.tree = {
        name: this.baseDomain,
        path: '/',
        children: [],
        data: { loc: this.baseUrl }
      };
      
      // Add homepage to queue
      this.addToQueue(this.baseUrl, 0, []);
      
      // Start crawling
      this.state.status = 'crawling';
      this.state.stats.startTime = Date.now();
      this.onProgress(this.state);
      
      // Start the crawl loop
      await this.crawlLoop();
    } catch (error) {
      console.error('Crawl start error:', error);
      this.state.status = 'error';
      this.onProgress(this.state);
      throw error;
    }
  }

  private async crawlLoop(): Promise<void> {
    while (
      this.state.queue.length > 0 && 
      this.state.status === 'crawling' &&
      this.state.stats.pagesProcessed < this.maxPages
    ) {
      // Get next batch
      const batch = this.state.queue
        .sort((a, b) => a.priority - b.priority)
        .slice(0, this.batchSize);
      
      this.state.queue = this.state.queue.slice(this.batchSize);
      
      // Process batch in parallel
      const promises = batch.map(task => this.processPage(task));
      await Promise.allSettled(promises);
      
      // Update progress
      this.onProgress(this.state);
      
      // Delay between batches to avoid rate limiting
      if (this.state.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.crawlDelay));
      }
    }
    
    // Mark as complete
    if (this.state.status === 'crawling') {
      this.state.status = 'complete';
      this.onProgress(this.state);
    }
  }

  private async fetchWithProxy(url: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (const proxy of CORS_PROXIES) {
      try {
        console.log(`Trying proxy: ${proxy} for URL: ${url}`);
        const proxyUrl = proxy.includes('quest=') ? 
          proxy + encodeURIComponent(url) : 
          proxy + url;
          
        const response = await fetch(proxyUrl, {
          signal: this.abortController?.signal,
          headers: {
            'Accept': 'text/html',
            'X-Requested-With': 'XMLHttpRequest' // Required for some proxies
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        console.log(`Successfully fetched ${url} via ${proxy}`);
        return html;
      } catch (error) {
        console.error(`Failed with proxy ${proxy}:`, error);
        lastError = error as Error;
        continue; // Try next proxy
      }
    }
    
    throw lastError || new Error('All proxies failed');
  }

  private async processPage(task: CrawlTask): Promise<void> {
    if (this.state.discovered.has(task.url)) {
      return;
    }
    
    this.state.discovered.add(task.url);
    this.state.stats.pagesProcessed++;
    
    try {
      // Fetch the page through CORS proxy
      const html = await this.fetchWithProxy(task.url);
      
      // Parse links from HTML
      const links = this.extractLinks(html, task.url);
      
      // Add page to tree
      this.addToTree(task.url, task.parentPath);
      
      // Queue new links if within depth limit
      if (task.depth < this.maxDepth) {
        links.forEach(link => {
          if (!this.state.discovered.has(link) && this.state.stats.pagesFound < this.maxPages) {
            const newPath = [...task.parentPath, this.getPageName(task.url)];
            this.addToQueue(link, task.depth + 1, newPath);
          }
        });
      }
      
      // Update current depth
      this.state.stats.currentDepth = Math.max(this.state.stats.currentDepth, task.depth);
      
      // Estimate total pages (rough heuristic)
      if (this.state.stats.pagesProcessed < 10) {
        this.state.stats.estimatedTotal = Math.min(
          links.length * Math.pow(links.length, this.maxDepth - task.depth),
          this.maxPages
        );
      }
    } catch (error) {
      console.error(`Failed to crawl ${task.url}:`, error);
      this.state.stats.failedPages.push(task.url);
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: Set<string> = new Set();
    const base = new URL(baseUrl);
    
    // Regular expression to find href attributes
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match;
    
    while ((match = hrefRegex.exec(html)) !== null) {
      try {
        const href = match[1];
        
        // Skip certain types of links
        if (
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          href.includes('.pdf') ||
          href.includes('.jpg') ||
          href.includes('.png') ||
          href.includes('.gif')
        ) {
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
        }
      } catch (e) {
        // Invalid URL, skip it
      }
    }
    
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
    
    this.state.queue.push({
      url,
      depth,
      parentPath,
      priority
    });
    
    this.state.stats.pagesFound++;
  }

  private addToTree(url: string, _parentPath: string[]): void {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(s => s);
    
    let currentNode = this.state.tree;
    
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
      }
      currentNode = child;
    }
    
    // Add the page if it doesn't exist
    const leafName = pathSegments[pathSegments.length - 1] || 'Home';
    if (!currentNode.children?.find(c => c.name === leafName)) {
      if (!currentNode.children) {
        currentNode.children = [];
      }
      currentNode.children.push({
        name: leafName,
        path: urlObj.pathname,
        data: { loc: url },
        children: []
      });
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

export default ProgressiveCrawler;