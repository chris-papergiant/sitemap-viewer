# Vercel Analytics Implementation

## Overview
Comprehensive analytics tracking has been implemented for all major user interactions in the Sitemap Viewer application.

## Events Tracked

### 1. Sitemap Search Events

#### `sitemap_search`
Triggered when a user searches for a sitemap
```javascript
{
  url: string,           // Full URL entered
  domain: string,        // Extracted domain name
  timestamp: string      // ISO timestamp
}
```

#### `sitemap_success`
Triggered when a sitemap is successfully fetched and parsed
```javascript
{
  domain: string,        // Website domain
  urlCount: number,      // Number of URLs found
  type: 'sitemap' | 'sitemap_index'  // Type of sitemap
}
```

#### `sitemap_failed`
Triggered when sitemap fetch fails
```javascript
{
  domain: string,        // Website domain
  error: string,         // Error message
  type: 'sitemap'        // Always 'sitemap' for now
}
```

### 2. Crawler Events

#### `crawler_started`
Triggered when user initiates website crawling
```javascript
{
  domain: string,        // Website domain
  timestamp: string      // ISO timestamp
}
```

#### `crawler_success`
Triggered when crawling completes successfully
```javascript
{
  domain: string,              // Website domain
  pagesDiscovered: number,     // Total pages found
  pagesProcessed: number,      // Pages successfully processed
  duration: number             // Time taken in seconds
}
```

#### `crawler_failed`
Triggered when crawling fails
```javascript
{
  domain: string,        // Website domain
  error: string,         // Error message
  type: 'blocked' | 'network'  // Type of failure
}
```

### 3. Visualization Events

#### `view_changed`
Triggered when user switches between visualization views
```javascript
{
  from: 'explorer' | 'columns' | 'graph',  // Previous view
  to: 'explorer' | 'columns' | 'graph',    // New view
  domain: string,                           // Current website
  urlCount: number                          // Number of URLs
}
```

### 4. Export Events

#### `csv_downloaded`
Triggered when user downloads CSV export
```javascript
{
  domain: string,              // Website domain
  urlCount: number,            // Number of URLs exported
  source: 'crawler' | 'sitemap',  // How data was obtained
  timestamp: string            // ISO timestamp
}
```

### 5. Search Events

#### `search_performed`
Triggered when user searches within the sitemap
```javascript
{
  query: string,         // Search query
  urlCount: number,      // Total URLs being searched
  timestamp: string      // ISO timestamp
}
```

#### `search_cleared`
Triggered when user clears the search
```javascript
{
  urlCount: number,      // Total URLs
  timestamp: string      // ISO timestamp
}
```

## Implementation Details

### Libraries Used
- `@vercel/analytics`: ^1.5.0
- Integrated in `main.tsx` with `<Analytics />` component
- `track` function imported for custom events

### Key Metrics to Track

1. **User Journey**
   - URL → Success/Failure → View Changes → Export

2. **Popular Domains**
   - Which websites are most commonly analyzed

3. **Feature Usage**
   - Sitemap vs Crawler usage ratio
   - Most popular visualization view
   - Search feature engagement
   - CSV export frequency

4. **Error Patterns**
   - Common failure reasons
   - Blocked domains (government/corporate sites)

5. **Performance**
   - Crawler duration by domain
   - Number of pages typically discovered

## Testing Analytics

To test analytics in development:

1. Events will be logged but not sent in development mode
2. Deploy to Vercel to see real analytics
3. Check Vercel Analytics dashboard for:
   - Custom Events section
   - Event frequency
   - Event properties

## Privacy Considerations

- No personal data is tracked
- Only domain names and interaction patterns
- All timestamps are ISO format without timezone
- Search queries are tracked but anonymized

## Future Enhancements

Consider tracking:
- Time spent on each view
- Scroll depth in visualizations
- Filter usage patterns
- Error recovery actions
- Session duration