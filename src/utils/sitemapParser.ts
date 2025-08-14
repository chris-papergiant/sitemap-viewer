import { XMLParser } from 'fast-xml-parser';

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
  const corsProxies = [
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://proxy.cors.sh/${url}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  ];
  
  let lastError: Error | null = null;
  
  // Try each sitemap location
  for (let i = 0; i < sitemapCandidates.length; i++) {
    const sitemapUrl = sitemapCandidates[i];
    
    // Handle robots.txt specially
    if (sitemapUrl.endsWith('/robots.txt')) {
      onProgress?.(`Checking robots.txt for sitemap directives...`);
      try {
        const robotsContent = await fetchWithProxies(sitemapUrl, corsProxies);
        const sitemapMatch = robotsContent.match(/^Sitemap:\s*(.+)$/im);
        if (sitemapMatch && sitemapMatch[1]) {
          const robotsSitemapUrl = sitemapMatch[1].trim();
          onProgress?.(`Found sitemap in robots.txt: ${new URL(robotsSitemapUrl).pathname}`);
          return await fetchWithProxies(robotsSitemapUrl, corsProxies);
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
    const locationIndex = i; // robots.txt was first, so this is the actual location attempt
    onProgress?.(`Trying ${locationName}... (${locationIndex}/${sitemapCandidates.length - 1})`);
    
    try {
      const result = await fetchWithProxies(sitemapUrl, corsProxies);
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
    throw new Error(`No sitemap found. The website is blocking access to its sitemap (403 Forbidden). This is common for government and banking sites.`);
  } else if (lastError?.message.includes('404') || lastError?.message.includes('Not Found')) {
    throw new Error(`No sitemap found at any standard location. The website may not have a public sitemap.xml file.`);
  } else {
    throw new Error(`No sitemap found. Checked robots.txt and tried ${sitemapCandidates.length - 1} common locations. ${lastError?.message || 'Unable to access the site.'}`);
  }
};

// Helper function to try multiple CORS proxies
const fetchWithProxies = async (url: string, corsProxies: ((url: string) => string)[]): Promise<string> => {
  let lastError: Error | null = null;
  
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
      if (!url.endsWith('/robots.txt')) {
        // Check for common error page indicators
        if (text.includes('404') || text.includes('Not Found') || 
            text.includes('403') || text.includes('Forbidden') ||
            text.includes('Error') || text.includes('error')) {
          console.log('Response appears to be an error page, not XML');
          throw new Error('Response appears to be an error page, not a valid sitemap');
        }
        
        if (!text.includes('<?xml') && !text.includes('<urlset') && !text.includes('<sitemapindex')) {
          console.log('Response does not contain XML markers. First 200 chars:', text.substring(0, 200));
          throw new Error('Response does not appear to be a valid sitemap XML');
        }
      }
      
      console.log('Successfully fetched content, length:', text.length);
      return text;
    } catch (error) {
      console.error('Proxy failed:', error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue;
    }
  }
  
  throw lastError || new Error('All CORS proxies failed');
};