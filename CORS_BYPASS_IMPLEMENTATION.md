# CORS Bypass Implementation Strategy

## Problem Statement

The Sitemap Viewer application currently faces significant limitations when fetching sitemaps and crawling websites due to CORS (Cross-Origin Resource Sharing) restrictions:

1. **CORS Proxy Blocking**: Many websites (especially government and banking sites) actively block popular CORS proxy services
2. **Inconsistent Success Rates**: Current proxies (proxy.cors.sh, corsproxy.io, etc.) are increasingly unreliable
3. **Complete Failures**: Sites like vichealth.vic.gov.au completely block all current proxy attempts
4. **User Frustration**: Users see "No sitemap found" errors even when sitemaps exist

## Solution Overview

Implement a **tiered fetching strategy** that combines client-side proxies (for speed) with server-side browser automation (for reliability):

```
User Request → Try Client Proxies (fast) → Fallback to Server API (reliable) → Return Data
```

## Architecture

### Tiered Fetching Strategy

#### Tier 1: Client-Side CORS Proxies (Default)
- **When**: First attempt for all requests
- **Why**: Fast, no server resources, works for ~70% of sites
- **Proxies**:
  - api.codetabs.com
  - proxy.cors.sh
  - corsproxy.io
  - cors.lol (new)

#### Tier 2: Server-Side Browser Automation (Fallback)
- **When**: All client proxies fail
- **Why**: Bypasses CORS completely, acts like real browser
- **Technology**: Playwright with @sparticuz/chromium-min on Vercel Functions

#### Tier 3: External Browser Service (Future/Enterprise)
- **When**: Large-scale crawling, enterprise users
- **Why**: No timeout/memory limitations
- **Options**: Browserless.io, self-hosted browser pool

### Technical Stack

```javascript
// Dependencies for server-side solution
{
  "dependencies": {
    "playwright-core": "^1.40.0",      // Lightweight Playwright (no browsers)
    "@sparticuz/chromium-min": "^119.0.0"  // Serverless Chromium (<50MB)
  }
}
```

## Implementation Plan

### Phase 1: Create Vercel API Route

#### 1.1 Create `/api/browser-fetch.ts`

```typescript
// api/browser-fetch.ts
import { chromium } from 'playwright-core';
import chromiumMin from '@sparticuz/chromium-min';

export default async function handler(req, res) {
  const { url, type = 'sitemap' } = req.body;
  
  // Launch browser with serverless config
  const browser = await chromium.launch({
    args: chromiumMin.args,
    executablePath: await chromiumMin.executablePath(),
    headless: true
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to appear as regular browser
    await page.setUserAgent('Mozilla/5.0...');
    
    // Navigate and get content
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // For sitemaps, get the raw XML
    if (type === 'sitemap') {
      const content = await page.content();
      // Extract XML from page
      const xml = extractXML(content);
      return res.json({ success: true, content: xml });
    }
    
    // For crawler, get the HTML
    if (type === 'crawler') {
      const html = await page.content();
      return res.json({ success: true, html });
    }
    
  } finally {
    await browser.close();
  }
}
```

#### 1.2 Optimize for Serverless Constraints

- **Bundle size**: Use @sparticuz/chromium-min (compressed to <50MB)
- **Memory**: Limit concurrent pages, close browser after each request
- **Timeout**: Set 30s timeout for navigation (Vercel limit: 60s free, 900s paid)
- **Cold starts**: Accept 2-5s initial delay

### Phase 2: Update Frontend Integration

#### 2.1 Modify `sitemapParser.ts`

```typescript
// utils/sitemapParser.ts
const fetchWithProxies = async (url: string, corsProxies: Array) => {
  // Try client-side proxies first
  for (const proxyFn of corsProxies) {
    try {
      // ... existing proxy logic
      return result;
    } catch (error) {
      continue;
    }
  }
  
  // NEW: Fallback to server-side API
  try {
    const response = await fetch('/api/browser-fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url, 
        type: 'sitemap' 
      })
    });
    
    if (!response.ok) throw new Error('API fetch failed');
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    throw new Error('All fetch methods failed');
  }
};
```

#### 2.2 Update `progressiveCrawler.ts`

```typescript
// utils/progressiveCrawler.ts
private async fetchWithProxy(url: string): Promise<string> {
  // Quick check for known problematic domains
  const useServerSide = this.shouldUseServerSide(url);
  
  if (!useServerSide) {
    // Try proxies first (existing logic)
    for (const proxy of CORS_PROXIES) {
      try {
        // ... existing proxy attempts
        return html;
      } catch (error) {
        continue;
      }
    }
  }
  
  // Fallback or direct to server-side
  return this.fetchViaAPI(url);
}

private shouldUseServerSide(url: string): boolean {
  const serverSideDomains = [
    '.gov.au', '.gov', '.edu',
    'vichealth.vic.gov.au'
  ];
  return serverSideDomains.some(domain => url.includes(domain));
}

private async fetchViaAPI(url: string): Promise<string> {
  const response = await fetch('/api/browser-fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      url, 
      type: 'crawler',
      sessionId: this.crawlSessionId // For potential connection reuse
    })
  });
  
  const data = await response.json();
  return data.html;
}
```

### Phase 3: Crawler Optimization

#### 3.1 Batch Processing
- Send multiple URLs to API in one request
- Process up to 3 pages per API call to reduce overhead

#### 3.2 Connection Reuse
- Keep browser instance alive for crawl session
- Use session ID to maintain browser state between requests

#### 3.3 Smart Routing
- Maintain list of domains that require server-side fetch
- Learn from failures and adapt routing strategy

### Phase 4: Performance Enhancements

#### 4.1 Caching Layer
```typescript
// Simple in-memory cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache(url: string) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchViaAPI(url);
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

#### 4.2 Request Queue
- Queue requests to prevent overwhelming the API
- Implement exponential backoff for failures

#### 4.3 Progress Indicators
- Show "Using advanced fetching..." when server-side is active
- Indicate expected longer wait times

## User Experience

### Loading States
```typescript
// Different messages based on fetch method
const getLoadingMessage = (method: string) => {
  switch(method) {
    case 'proxy':
      return 'Fetching sitemap...';
    case 'server':
      return 'Using advanced browser engine (may take a few seconds)...';
    case 'retry':
      return 'Trying alternative method...';
  }
};
```

### Error Messages
- Clear indication when proxies fail but server-side might work
- Suggest using crawler for sites without sitemaps
- Provide timeout warnings for large sites

## Limitations & Mitigations

### Vercel Constraints

| Constraint | Free Tier | Pro Tier | Mitigation |
|------------|-----------|----------|------------|
| Timeout | 60 seconds | 900 seconds | Process in batches, show progress |
| Memory | 1024 MB | 3008 MB | Use chromium-min, close tabs quickly |
| Bundle Size | 50 MB | 50 MB | Use @sparticuz/chromium-min |
| Cold Start | 2-5 seconds | 2-5 seconds | Show appropriate loading message |

### Performance Impact

- **Client-side proxies**: <1 second per request
- **Server-side browser**: 2-10 seconds per request
- **Cold start penalty**: Additional 2-5 seconds on first request

### Cost Considerations

- Each server-side request uses Vercel Function execution time
- Monitor usage to stay within plan limits
- Consider caching to reduce repeated fetches

## Testing Strategy

### Test Sites

1. **Working with proxies**: portable.com.au, papergiant.net
2. **Blocked by proxies**: vichealth.vic.gov.au, gov.au sites
3. **Large sitemaps**: Sites with >1000 URLs
4. **Complex structures**: Sitemap index files

### Success Metrics

- ✅ Sites that previously failed now work
- ✅ Maintain <1s response for proxy-compatible sites  
- ✅ Server-side fallback completes within 10s
- ✅ Clear user feedback during longer operations
- ✅ Graceful degradation when limits reached

## Rollout Plan

1. **Phase 1**: Deploy API route, test with manual requests
2. **Phase 2**: Update sitemap fetcher to use fallback
3. **Phase 3**: Integrate crawler with server-side option
4. **Phase 4**: Add caching and performance optimizations
5. **Phase 5**: Monitor and optimize based on usage patterns

## Future Enhancements

1. **WebSocket Support**: Real-time progress for long crawls
2. **Distributed Crawling**: Split large sites across multiple functions
3. **Smart Caching**: Predictive caching for common sites
4. **Browser Pool**: Maintain warm browser instances
5. **External Service Integration**: Browserless.io for enterprise

## Security Considerations

- Validate and sanitize all URLs before processing
- Implement rate limiting to prevent abuse
- Use timeouts to prevent hanging requests
- Log requests for monitoring and debugging
- Consider API key authentication for production

## Monitoring & Observability

- Track success/failure rates by domain
- Monitor API response times
- Alert on high failure rates
- Log which fetch method succeeded
- Track Vercel Function usage and costs

## Conclusion

This implementation provides a robust solution to CORS restrictions while maintaining fast performance for sites that don't require it. The tiered approach ensures the best possible user experience while working within the constraints of serverless architecture.