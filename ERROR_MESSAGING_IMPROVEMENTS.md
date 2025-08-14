# Error Messaging Improvements

## Changes Made

### 1. Clearer Error Detection
The app now detects specific error types and provides appropriate messages:

- **403/Forbidden Errors** → "Website is blocking automated crawlers"
- **Network Errors** → "Unable to connect to the website"  
- **No Sitemap** → "No sitemap found at any standard location"

### 2. Improved User Messages

#### When Site Blocks Crawlers:
**Title**: "Website Restricts Automated Access"
**Icon**: 🛡️ Security Restriction Detected
**Message**: "This website is blocking automated crawlers. The site has security measures that prevent browser-based tools from accessing it. This is common for government sites and some corporate websites."

**Helpful Tips**:
- Try a different website (most commercial sites work fine)
- Government and banking sites often block crawlers
- Consider using a server-side crawler for restricted sites
- Contact the site owner for sitemap access if needed

#### When Sitemap Missing:
**Title**: "No sitemap available"
**Message**: Clear explanation of what went wrong
**Helpful Tips**: 
- Check URL correctness
- Try with/without 'www'
- Note about blocked access
- Website may not have sitemap

### 3. Technical Error Messages

In the console, errors are now more descriptive:
- `"All proxies failed - Website is blocking automated crawlers (403 Forbidden)"`
- `"All proxies failed - Network error or site blocking access"`
- `"No sitemap found. The website is blocking access to its sitemap (403 Forbidden)"`

### 4. Context-Aware UI

The error dialog now:
- Changes title based on error type
- Shows different suggestions based on the issue
- Clearly differentiates between "blocked" vs "not found"
- Provides actionable next steps

## User Experience

### Before:
Generic error: "Failed to crawl website. The site may be blocking automated access..."

### After:
Specific, clear messages that explain:
- **What happened**: "Website is blocking automated crawlers"
- **Why it happened**: "Security measures... common for government sites"
- **What to do**: Specific, actionable suggestions

## Testing

Try with different sites to see the messages:
- **Blocked site** (vichealth.vic.gov.au): Shows security restriction message
- **Working site** (portable.com.au): Crawls successfully
- **Site without sitemap**: Shows sitemap not found message

The improved error messages make it immediately clear when a site is actively blocking access versus when technical issues occur.