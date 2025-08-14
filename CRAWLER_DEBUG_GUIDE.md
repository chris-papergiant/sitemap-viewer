# Crawler Debug Guide

## Summary of Changes

We've added comprehensive logging and debugging tools to help diagnose issues with the progressive crawler, particularly for sites like vichealth.vic.gov.au that may have CORS or access restrictions.

## Key Features Added

### 1. Enhanced Logging in progressiveCrawler.ts
- **Color-coded console output** with timestamps and emojis for easy visual parsing
- **Detailed request tracking** with request numbers and timing information  
- **Comprehensive proxy testing** logs showing which CORS proxy is being tried and response details
- **Link extraction analytics** showing how many links were found vs skipped
- **Tree building visualization** showing how the sitemap structure is being built

### 2. App.tsx Callback Logging
- **Crawler lifecycle tracking** from initialization to completion
- **State update monitoring** showing discovered pages, queue size, and processing status
- **Error detail capture** with stack traces for debugging

### 3. Debug Tools (CrawlerDebug)
Available in the browser console when the app is running:

```javascript
// Test all CORS proxies with a specific URL
CrawlerDebug.testProxies('https://vichealth.vic.gov.au')

// Get current crawler state
CrawlerDebug.getState()

// List failed pages
CrawlerDebug.getFailedPages()

// Run a test crawl with custom settings
CrawlerDebug.testCrawl('https://example.com', maxDepth=2, maxPages=10)

// Show help
CrawlerDebug.help()
```

### 4. Test Files
- **test-cors-proxy.html** - Simple proxy tester
- **test-crawler-debug.html** - Comprehensive crawler testing UI

## How to Debug Crawler Issues

### Step 1: Open Browser Console
Press F12 or right-click → Inspect → Console tab

### Step 2: Try to Crawl a Site
1. Enter the URL in the app
2. When sitemap fails, click "Start Website Crawl"
3. Watch the console for detailed logs

### Step 3: Analyze the Logs
Look for:
- 🚀 **CRAWLER START** - Shows initial configuration
- 🌐 **Request logs** - Shows each URL fetch attempt
- 🔄 **Proxy attempts** - Which CORS proxies are tried
- ❌ **Errors** - Detailed error messages with context
- 📊 **Statistics** - Link extraction and queue management

### Step 4: Use Debug Commands
While the crawler is running or after it completes:

```javascript
// Check current state
CrawlerDebug.getState()

// See which pages failed
CrawlerDebug.getFailedPages()

// Test proxies independently
CrawlerDebug.testProxies('https://problematic-site.com')
```

## Common Issues and Solutions

### Issue: All CORS Proxies Fail
**Symptoms:**
- All three proxy attempts show errors
- Network/CORS errors in console

**Solutions:**
1. Some sites block all CORS proxies (especially government sites)
2. Try a different site to verify proxies are working
3. Check if the site requires specific headers or authentication

### Issue: Links Not Being Discovered
**Symptoms:**
- Page fetches successfully but finds 0 links
- Tree structure remains empty

**Debug Steps:**
1. Check "Link extraction complete" log for statistics
2. Look at "skipped" counts - are links being filtered out?
3. Verify the site uses standard `<a href="">` tags

### Issue: Crawler Stops Prematurely
**Symptoms:**
- Crawler completes with few pages discovered
- Queue empties quickly

**Check:**
1. Max depth setting (default is 3)
2. Max pages setting (default is 500)
3. Failed pages list - are many pages failing?

## Testing Workflow

1. **Open test-crawler-debug.html** in a browser
2. **Test CORS proxies first** to ensure they're accessible
3. **Run a small test crawl** (depth=2, pages=10) to verify basic functionality
4. **Check the main app** with full logging enabled
5. **Use CrawlerDebug commands** for runtime inspection

## Log Interpretation

### Successful Crawl Pattern
```
🚀 CRAWLER START
📦 Batch #1
📄 Processing Page: https://example.com
🌐 Request #1: Fetching https://example.com
✅ Success with cors.sh!
🔗 Found 15 links
✅ Page processed successfully
```

### Failed Crawl Pattern
```
🚀 CRAWLER START
📦 Batch #1
📄 Processing Page: https://example.com
🌐 Request #1: Fetching https://example.com
❌ Failed with cors.sh
❌ Failed with codetabs
❌ Failed with cors-anywhere
❌ ALL PROXIES FAILED
❌ Failed to process page
```

## Notes

- The crawler will NOT modify any data or push changes
- All logging is client-side only (browser console)
- Debug tools are automatically available when the app loads
- Government sites (.gov.au) often have stricter CORS policies