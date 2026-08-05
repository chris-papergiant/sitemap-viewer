import { XMLParser } from 'fast-xml-parser';
import { isProtectedSite, fetchTextViaServerProxy } from './serverFetch';

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export interface ParsedSitemap {
  urls: SitemapEntry[];
  sitemaps?: string[];
}

export const parseSitemapXML = (xmlContent: string): ParsedSitemap => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    removeNSPrefix: true, // Remove namespace prefixes
    parseTagValue: true,
    trimValues: true,
  });

  console.log('Parsing XML content, length:', xmlContent.length);
  
  const result = parser.parse(xmlContent);
  const parsed: ParsedSitemap = { urls: [] };
  
  console.log('Parsed result:', JSON.stringify(result, null, 2).substring(0, 500));

  // Handle urlset (regular sitemap)
  if (result.urlset && result.urlset.url) {
    const urls = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
    parsed.urls = urls.map((url: any) => ({
      loc: typeof url === 'string' ? url : url.loc,
      lastmod: url.lastmod,
      changefreq: url.changefreq,
      priority: url.priority ? parseFloat(url.priority) : undefined,
    })).filter((url: SitemapEntry) => url.loc); // Filter out entries without loc
    
    console.log(`Found ${parsed.urls.length} URLs in urlset`);
  }

  // Handle sitemapindex (sitemap of sitemaps)
  if (result.sitemapindex && result.sitemapindex.sitemap) {
    const sitemaps = Array.isArray(result.sitemapindex.sitemap) 
      ? result.sitemapindex.sitemap 
      : [result.sitemapindex.sitemap];
    parsed.sitemaps = sitemaps.map((sitemap: any) => 
      typeof sitemap === 'string' ? sitemap : sitemap.loc
    ).filter(Boolean);
    
    console.log(`Found ${parsed.sitemaps?.length || 0} nested sitemaps`);
  }

  // Sometimes the structure might be different, try alternative paths
  if (parsed.urls.length === 0 && !parsed.sitemaps) {
    // Check if there's a direct array of URLs
    const findUrls = (obj: any): string[] => {
      const foundUrls: string[] = [];
      
      if (typeof obj === 'object' && obj !== null) {
        if (obj.loc) {
          foundUrls.push(obj.loc);
        }
        
        for (const key in obj) {
          if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any) => {
              foundUrls.push(...findUrls(item));
            });
          } else if (typeof obj[key] === 'object') {
            foundUrls.push(...findUrls(obj[key]));
          }
        }
      }
      
      return foundUrls;
    };
    
    const extractedUrls = findUrls(result);
    if (extractedUrls.length > 0) {
      parsed.urls = extractedUrls.map(loc => ({ loc }));
      console.log(`Found ${parsed.urls.length} URLs using deep search`);
    }
  }

  return parsed;
};

// Smart sitemap detection - check robots.txt first, then common locations
const getSitemapAlternatives = (baseUrl: string): string[] => {
  return [
    `${baseUrl}/robots.txt`, // Check robots.txt first - it's the standard way
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-index.xml`,
    `${baseUrl}/sitemaps/sitemap.xml`,
    `${baseUrl}/sitemaps/sitemap_index.xml`,
    `${baseUrl}/wp-sitemap.xml`,
    `${baseUrl}/wp-sitemap-index.xml`,
    `${baseUrl}/sitemap1.xml`,
    `${baseUrl}/main-sitemap.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
    `${baseUrl}/sitemap/index.xml`,
  ];
};

// Proxy functions shared by fetchSitemap and fetchSitemapDirect
const buildCorsProxies = (): ((url: string) => string)[] => [
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://proxy.cors.sh/${url}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
];

/**
 * Fetch a sitemap from an exact, known URL (e.g. a child of a sitemap
 * index). Unlike fetchSitemap, this does not probe robots.txt or the common
 * sitemap locations when the URL fails — a missing child is just missing.
 */
export const fetchSitemapDirect = async (url: string, onProgress?: (message: string) => void): Promise<string> => {
  return fetchWithProxies(url, buildCorsProxies(), onProgress);
};

export const fetchSitemap = async (url: string, onProgress?: (message: string) => void): Promise<string> => {
  // Clean up the URL
  let baseUrl = url.trim();
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'https://' + baseUrl;
  }
  
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // If the URL already ends with .xml, try it first
  const sitemapCandidates = baseUrl.endsWith('.xml') 
    ? [baseUrl, ...getSitemapAlternatives(baseUrl.replace(/\/[^\/]*\.xml$/, ''))]
    : getSitemapAlternatives(baseUrl);
  
  // Try multiple CORS proxies in order of reliability
  // Note: api.codetabs.com tends to work better than proxy.cors.sh for some sites
  const corsProxies = buildCorsProxies();

  let lastError: Error | null = null;
  
  // Try each sitemap location
  for (let i = 0; i < sitemapCandidates.length; i++) {
    const sitemapUrl = sitemapCandidates[i];
    
    // Handle robots.txt specially
    if (sitemapUrl.endsWith('/robots.txt')) {
      onProgress?.(`Checking robots.txt for sitemap directives...`);
      try {
        const robotsContent = await fetchWithProxies(sitemapUrl, corsProxies, onProgress);
        // robots.txt can declare multiple sitemaps (common on gov.au sites) — try each
        const robotsSitemapUrls = Array.from(
          robotsContent.matchAll(/^Sitemap:\s*(.+)$/gim),
          match => match[1].trim()
        ).filter(Boolean);

        if (robotsSitemapUrls.length > 0) {
          for (const robotsSitemapUrl of robotsSitemapUrls) {
            try {
              onProgress?.(`Found sitemap in robots.txt: ${new URL(robotsSitemapUrl).pathname}`);
              return await fetchWithProxies(robotsSitemapUrl, corsProxies, onProgress);
            } catch (error) {
              console.log(`Failed to fetch sitemap from robots.txt entry ${robotsSitemapUrl}:`, error);
              continue;
            }
          }
          onProgress?.(`Sitemaps listed in robots.txt were unreachable, trying common locations...`);
        } else {
          onProgress?.(`No sitemap found in robots.txt, trying common locations...`);
        }
      } catch (error) {
        console.log('Failed to check robots.txt:', error);
        onProgress?.(`Couldn't access robots.txt, trying common locations...`);
      }
      continue;
    }
    
    const locationName = new URL(sitemapUrl).pathname;
    onProgress?.(`Trying ${locationName}... (${i}/${sitemapCandidates.length - 1})`);
    
    try {
      const result = await fetchWithProxies(sitemapUrl, corsProxies, onProgress);
      console.log(`Successfully fetched sitemap from: ${sitemapUrl}`);
      return result;
    } catch (error) {
      console.log(`Failed to fetch from ${sitemapUrl}:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }
  
  // Provide more specific error message based on the failure type
  if (lastError?.message.includes('403') || lastError?.message.includes('Forbidden')) {
    throw new Error(`No sitemap found. The website is blocking access to its sitemap (403 Forbidden), even via server-side fetching. Try the crawler instead.`);
  } else if (lastError?.message.includes('404') || lastError?.message.includes('Not Found')) {
    throw new Error(`No sitemap found at any standard location. The website may not have a public sitemap.xml file.`);
  } else {
    throw new Error(`No sitemap found. Checked robots.txt and tried ${sitemapCandidates.length - 1} common locations. ${lastError?.message || 'Unable to access the site.'}`);
  }
};

// Validate that fetched content looks like a sitemap (or robots.txt, which is exempt)
const validateSitemapContent = (text: string, url: string): string => {
  if (url.endsWith('/robots.txt')) {
    return text;
  }

  // Check if it's actually XML content
  const isXML = text.includes('<?xml') || text.includes('<urlset') || text.includes('<sitemapindex');

  // Only reject if it's clearly an HTML error page
  const isHTMLError = !isXML && (
    (text.includes('<html') && (text.includes('404') || text.includes('403'))) ||
    text.includes('<!DOCTYPE html') && (text.includes('Not Found') || text.includes('Forbidden'))
  );

  if (isHTMLError) {
    console.log('Response appears to be an HTML error page');
    throw new Error('Response appears to be an error page, not a valid sitemap');
  }

  if (!isXML) {
    console.log('Response does not contain XML markers. First 200 chars:', text.substring(0, 200));
    throw new Error('Response does not appear to be a valid sitemap XML');
  }

  return text;
};

// Helper function to try multiple CORS proxies
const fetchWithProxies = async (url: string, corsProxies: ((url: string) => string)[], onProgress?: (message: string) => void): Promise<string> => {
  let lastError: Error | null = null;
  let triedServerProxy = false;

  // Government/protected sites block public CORS proxies but respond fine to
  // direct server-side requests — route them through our own proxy first
  if (isProtectedSite(url)) {
    triedServerProxy = true;
    try {
      onProgress?.('Government site detected — fetching via server...');
      const content = await fetchTextViaServerProxy(url);
      const validated = validateSitemapContent(content, url);
      console.log('Successfully fetched via server proxy, length:', validated.length);
      return validated;
    } catch (error) {
      console.log('Server proxy failed for protected site, falling back to CORS proxies:', error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  for (const proxyFn of corsProxies) {
    try {
      const proxyUrl = proxyFn(url);
      console.log('Trying CORS proxy:', proxyUrl);

      // Different proxies require different headers
      const headers: HeadersInit = {
        'Accept': 'application/xml, text/xml, */*'
      };

      // Only add X-Requested-With for proxy.cors.sh
      if (proxyUrl.includes('proxy.cors.sh')) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
      }

      const response = await fetch(proxyUrl, {
        mode: 'cors',
        headers
      });

      console.log(`Proxy response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.log(`Proxy returned error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      // Check if we got valid XML (skip this check for robots.txt)
      const validated = validateSitemapContent(text, url);

      console.log('Successfully fetched content, length:', validated.length);
      return validated;
    } catch (error) {
      console.error('Proxy failed:', error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }

  // Try our lightweight server proxy before the heavy browser-engine fallback
  if (!triedServerProxy) {
    try {
      onProgress?.('Public proxies failed — fetching via server...');
      const content = await fetchTextViaServerProxy(url);
      const validated = validateSitemapContent(content, url);
      console.log('Successfully fetched via server proxy, length:', validated.length);
      return validated;
    } catch (error) {
      console.log('Server proxy fallback failed:', error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }
  }

  // Try server-side browser fetch as final fallback
  console.log('All CORS proxies failed, trying server-side browser fetch...');
  
  // Notify progress callback about server-side fetch
  if (onProgress) {
    onProgress('Using advanced browser engine (this may take a few seconds)...');
  }
  
  try {
    const response = await fetch('/api/browser-fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url, 
        type: 'sitemap' 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Successfully fetched via server-side browser, length:', data.content?.length);
      return validateSitemapContent(data.content, url);
    } else {
      throw new Error(data.error || 'Server-side fetch failed');
    }
  } catch (apiError) {
    console.error('Server-side fetch also failed:', apiError);
    // If server-side also fails, throw the original error
    throw lastError || new Error('All fetch methods failed (proxies and server-side)');
  }
};