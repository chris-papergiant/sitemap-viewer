import { chromium } from 'playwright-core';
import chromiumMin from '@sparticuz/chromium-min';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache browser executable path
let executablePath: string | null = null;

// Set the chromium binary URL for @sparticuz/chromium-min
// Using the latest stable version v138
const CHROMIUM_PACK_URL = 'https://github.com/Sparticuz/chromium/releases/download/v138.0.0-pack/chromium-v138.0.0-pack.tar';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, type = 'sitemap' } = req.body;

  // Validate input
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  console.log(`[Browser Fetch] Fetching ${type} from: ${url}`);

  let browser = null;

  try {
    // Get or cache the executable path
    if (!executablePath) {
      // Download and get the chromium binary path
      executablePath = await chromiumMin.executablePath(CHROMIUM_PACK_URL);
    }

    // Launch browser with serverless-optimized settings
    browser = await chromium.launch({
      args: [
        ...chromiumMin.args,
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath,
      headless: true
    });

    const context = await browser.newContext({
      // Set a real user agent to avoid detection
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Bypass CSP to avoid content security policy issues
      bypassCSP: true,
      // Ignore HTTPS errors
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Set extra headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept': type === 'sitemap' 
        ? 'application/xml, text/xml, application/xhtml+xml, text/html, */*'
        : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    console.log(`[Browser Fetch] Navigating to ${url}...`);

    // Navigate to the URL with network idle wait
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000 // 30 second timeout
    });

    if (!response) {
      throw new Error('No response received from page');
    }

    const status = response.status();
    console.log(`[Browser Fetch] Response status: ${status}`);

    // Check for error status codes
    if (status >= 400) {
      return res.status(200).json({
        success: false,
        error: `HTTP ${status}: ${response.statusText()}`,
        status
      });
    }

    // Handle sitemap fetching
    if (type === 'sitemap') {
      // Get the page content
      const content = await page.content();
      
      // Try to extract XML content
      let xmlContent = content;
      
      // If the content is wrapped in HTML, try to extract the XML
      if (content.includes('<?xml')) {
        const xmlMatch = content.match(/<\?xml[\s\S]*?<\/(?:urlset|sitemapindex)>/);
        if (xmlMatch) {
          xmlContent = xmlMatch[0];
        }
      }
      
      // For XML displayed in browser, get the text content
      if (!xmlContent.includes('<?xml') && !xmlContent.includes('<urlset')) {
        const textContent = await page.evaluate(() => document.body?.innerText || document.documentElement.textContent);
        if (textContent && (textContent.includes('<?xml') || textContent.includes('<urlset'))) {
          xmlContent = textContent;
        }
      }

      console.log(`[Browser Fetch] Content length: ${xmlContent.length}, isXML: ${xmlContent.includes('<?xml')}`);

      return res.status(200).json({
        success: true,
        content: xmlContent,
        status,
        url
      });
    }

    // Handle crawler HTML fetching
    if (type === 'crawler') {
      // Wait for content to load
      await page.waitForLoadState('domcontentloaded');
      
      // Get the full HTML
      const html = await page.content();
      
      console.log(`[Browser Fetch] HTML length: ${html.length}`);

      return res.status(200).json({
        success: true,
        html,
        status,
        url
      });
    }

    // Unknown type
    return res.status(400).json({
      error: `Unknown fetch type: ${type}`
    });

  } catch (error) {
    console.error('[Browser Fetch] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(200).json({
      success: false,
      error: errorMessage,
      url
    });
    
  } finally {
    // Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}

// Export config for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    },
    responseLimit: '4mb'
  },
  maxDuration: 60 // Maximum function duration (60s for hobby, can be increased on paid plans)
};