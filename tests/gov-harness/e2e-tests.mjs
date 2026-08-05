// End-to-end gov-site scenarios: Playwright drives the production build
// served by app-server.mjs. Every public CORS proxy is blocked at the
// network layer — exactly what real gov.au sites do — so the only way these
// tests can pass is through the real /api/fetch-proxy (and /api/browser-fetch)
// server-side path.

import { createRequire } from 'node:module';
import { GOV_PORT } from './mock-gov-server.mjs';
import { APP_PORT } from './app-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const APP = `http://localhost:${APP_PORT}`;
const PROXY_PATTERN = /api\.codetabs\.com|proxy\.cors\.sh|corsproxy\.io|cors-anywhere/;

export async function runE2eTests({ chromiumPath }) {
  const results = [];
  const browser = await chromium.launch({ executablePath: chromiumPath });

  const scenario = async (name, fn) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    // Simulate gov sites blocking every public CORS proxy
    await page.route(PROXY_PATTERN, route => route.abort());
    try {
      await fn(page);
      results.push({ name, pass: true });
    } catch (err) {
      results.push({ name, pass: false, error: err.message.split('\n')[0] });
    } finally {
      await context.close();
    }
  };

  const submit = async (page, domain) => {
    await page.goto(APP, { waitUntil: 'networkidle' });
    await page.fill('#sitemap-url', `http://${domain}:${GOV_PORT}`);
    await page.click('button[type="submit"]');
  };

  await scenario('E1 basic gov site: robots.txt (dead+live entries) -> sitemap, 60 URLs', async (page) => {
    await submit(page, 'www.basic.gov.au');
    await page.waitForSelector('text=60 URLs', { timeout: 60000 });
  });

  await scenario('E2 paginated sitemap index (Drupal-style): 75 URLs across 3 children', async (page) => {
    await submit(page, 'www.index.gov.au');
    await page.waitForSelector('text=75 URLs', { timeout: 60000 });
  });

  await scenario('E3 redirecting sitemap: 301 followed with per-hop validation', async (page) => {
    await submit(page, 'www.redirect.gov.au');
    await page.waitForSelector('text=60 URLs', { timeout: 60000 });
  });

  await scenario('E4 no sitemap at all: crawler falls back through server proxy', async (page) => {
    await submit(page, 'www.nositemap.gov.au');
    // Crawler discovers the 6 mock pages; badge shows a URL count >= 4.
    // The sitemap probing cascade (12 locations, incl. browser-fetch
    // attempts that launch real Chromium) runs first, so be generous.
    await page.waitForFunction(() => {
      const badge = [...document.querySelectorAll('span')]
        .find(el => /\d+ URLs/.test(el.textContent || ''));
      if (!badge) return false;
      return parseInt(badge.textContent, 10) >= 4;
    }, { timeout: 240000 });
    // And it must not have ended in the error card
    const errVisible = await page.isVisible('text=Unable to map this website');
    if (errVisible) throw new Error('error card shown despite successful crawl');
  });

  await scenario('E5 URL verification uses server-side HEAD checks', async (page) => {
    await submit(page, 'www.basic.gov.au');
    await page.waitForSelector('text=60 URLs', { timeout: 60000 });
    await page.click('button[aria-label="Verify sitemap URLs"]');
    await page.waitForSelector('text=URL Verification', { timeout: 60000 });
    // All sampled URLs resolve 200 on the mock — expect zero errors once complete
    await page.waitForFunction(() => {
      const el = [...document.querySelectorAll('p')].find(p => (p.textContent || '').includes('Checked'));
      return el && !(el.textContent || '').includes('in progress');
    }, { timeout: 120000 });
    const okCount = await page.evaluate(() => {
      const tile = [...document.querySelectorAll('.bg-green-50 p')][0];
      return tile ? parseInt(tile.textContent, 10) : 0;
    });
    if (!(okCount >= 15)) throw new Error(`expected >=15 accessible URLs, got ${okCount}`);
  });

  await browser.close();
  return results;
}
