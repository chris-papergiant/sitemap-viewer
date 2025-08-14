# Sitemap Viewer - Project Memory

## Current Task: CORS Bypass Implementation

### Status: Planning Complete, Ready for Implementation

### Problem Being Solved
The application is facing significant CORS restrictions when fetching sitemaps and crawling websites. Many sites (especially government and banking) block the CORS proxy services we're using (proxy.cors.sh, corsproxy.io, etc.), resulting in failed fetches even when sitemaps exist.

### Solution Approach
Implementing a **tiered fetching strategy** that combines:
1. **Client-side CORS proxies** (fast, works for most sites)
2. **Server-side browser automation** via Vercel Functions with Playwright (reliable fallback)
3. **Future: External browser service** for enterprise/large-scale needs

### Technical Decisions

#### Architecture
- **Tiered approach**: Try proxies first for speed, fall back to server-side for reliability
- **Backwards compatible**: Existing functionality remains intact
- **Progressive enhancement**: Sites that work with proxies remain fast

#### Technology Stack
- **Playwright-core**: Lightweight browser automation (no browser binaries)
- **@sparticuz/chromium-min**: Serverless-optimized Chromium (<50MB for Vercel)
- **Vercel Functions**: API routes for server-side fetching
- **Node.js**: Required for Playwright (Python has poor serverless support)

#### Key Design Choices
1. **Why Playwright over Puppeteer**: Better cross-browser support, modern API
2. **Why @sparticuz/chromium-min**: Only way to fit within Vercel's 50MB limit
3. **Why tiered approach**: Maintains speed for sites that work, adds reliability for those that don't
4. **Why not Python**: Vercel's Python runtime has limited support for browser automation

### Implementation Phases

#### Phase 1: API Route Setup ⏳
- [ ] Create `/api/browser-fetch.ts` endpoint
- [ ] Install dependencies: playwright-core, @sparticuz/chromium-min
- [ ] Implement basic fetch with browser automation
- [ ] Handle both sitemap and crawler requests

#### Phase 2: Frontend Integration
- [ ] Update `sitemapParser.ts` to fall back to API
- [ ] Update `progressiveCrawler.ts` to use API for blocked sites
- [ ] Add loading states for server-side fetching
- [ ] Implement error handling for API failures

#### Phase 3: Optimization
- [ ] Add caching layer for repeated requests
- [ ] Implement request queuing
- [ ] Optimize for batch processing in crawler
- [ ] Add smart routing based on domain patterns

#### Phase 4: Monitoring & Polish
- [ ] Add analytics for fetch method success rates
- [ ] Implement proper timeout handling
- [ ] Create fallback messages for users
- [ ] Document API usage and limitations

### Known Constraints

#### Vercel Limitations
- **Function size**: 50MB compressed (hence chromium-min)
- **Timeout**: 60s free tier, 900s paid
- **Memory**: 1GB free tier, 3GB paid
- **Cold starts**: 2-5 second delay on first request

#### Performance Impact
- Client-side proxies: <1 second
- Server-side browser: 2-10 seconds
- Cold start penalty: +2-5 seconds

### Test Sites

#### Currently Working
- portable.com.au ✅
- papergiant.net ✅ (after proxy order fix)

#### Currently Failing (will be fixed)
- vichealth.vic.gov.au ❌ (blocks all proxies)
- Most .gov.au sites ❌
- Banking sites ❌

### Next Steps

1. **Immediate**: 
   - Install Playwright dependencies
   - Create basic API route
   - Test with vichealth.vic.gov.au

2. **This Week**:
   - Full integration with sitemap fetcher
   - Crawler fallback implementation
   - Performance testing

3. **Future**:
   - WebSocket support for real-time progress
   - External browser service integration
   - Enterprise features

### Files Modified/Created

#### Documentation
- ✅ `CORS_BYPASS_IMPLEMENTATION.md` - Complete implementation strategy
- ✅ `.claude/claude.md` - This file

#### To Be Created
- `/api/browser-fetch.ts` - Vercel Function for browser automation
- Updates to `utils/sitemapParser.ts`
- Updates to `utils/progressiveCrawler.ts`

### Important Notes

- The existing CORS proxy approach will remain the primary method (fast path)
- Server-side browser is only a fallback for failed requests
- This maintains optimal performance for the majority of use cases
- The implementation is designed to be transparent to users (just works)

### Commands to Remember

```bash
# Install new dependencies
npm install playwright-core @sparticuz/chromium-min

# Test API route locally
npm run dev
# Then POST to http://localhost:3000/api/browser-fetch

# Deploy to Vercel
git push origin main
```

### Success Criteria

✅ vichealth.vic.gov.au sitemap can be fetched
✅ Existing fast sites remain fast (<1s)
✅ Clear feedback when using server-side fetch
✅ Crawler works on previously blocked sites
✅ No breaking changes to existing functionality

---

*Last Updated: 2024-12-14*
*Current Focus: Ready to begin Phase 1 implementation*