// Mock gov.au origin server for the harness.
//
// Reproduces the behaviors documented for real Australian government sites
// (see VICHEALTH_FINAL_ANALYSIS.md): requests without browser-like headers
// are rejected, robots.txt may list several sitemaps, sitemap indexes are
// paginated Drupal-style, some sites redirect, and some have no sitemap at
// all so only crawling works.
//
// One HTTP server routes on the Host header. The harness maps these
// hostnames to 127.0.0.1 in /etc/hosts:
//   www.basic.gov.au      robots.txt with a dead + a live sitemap entry
//   www.index.gov.au      sitemap index -> 3 paginated child sitemaps
//   www.redirect.gov.au   /sitemap.xml 301s to www.basic.gov.au
//   www.nositemap.gov.au  no sitemap anywhere; crawlable HTML pages

import http from 'node:http';

export const GOV_PORT = 8091;

const XMLDECL = '<?xml version="1.0" encoding="UTF-8"?>';

const urlset = (host, paths) => `${XMLDECL}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url><loc>http://${host}:${GOV_PORT}${p}</loc><lastmod>2026-07-01</lastmod><priority>0.8</priority></url>`).join('\n')}
</urlset>`;

const BASIC_PATHS = Array.from({ length: 60 }, (_, i) => `/page-${i + 1}`);

// ~4.2MB of padding to trip the fetch-proxy size cap
let hugeSitemap = null;
const getHugeSitemap = () => {
  if (!hugeSitemap) {
    const filler = `${XMLDECL}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const row = `  <url><loc>http://www.basic.gov.au:${GOV_PORT}/padding-padding-padding-padding-padding</loc></url>\n`;
    hugeSitemap = filler + row.repeat(Math.ceil((4.2 * 1024 * 1024) / row.length)) + '</urlset>';
  }
  return hugeSitemap;
};

const crawlPage = (title, links) => {
  const nav = links.map(l => `<a href="${l}">${l}</a>`).join(' | ');
  return `<!DOCTYPE html>
<html lang="en"><head><title>${title} - Mock Gov Department</title></head>
<body>
<header><h1>Department of Harness Testing</h1><nav>${nav}</nav></header>
<main>
<p>${'This is placeholder content for the mock government website used by the test harness. '.repeat(15)}</p>
</main>
<footer><p>Commonwealth of Mockland ${nav}</p></footer>
</body></html>`;
};

const send = (res, status, contentType, body, extraHeaders = {}) => {
  res.writeHead(status, { 'Content-Type': contentType, ...extraHeaders });
  res.end(body);
};

const notFound = (res) => send(res, 404, 'text/html',
  '<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>Error 404</p></body></html>');

export function startMockGovServer() {
  const server = http.createServer((req, res) => {
    const host = (req.headers.host || '').split(':')[0].toLowerCase();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const isHead = req.method === 'HEAD';

    // Gov-style bot filtering: reject anything that doesn't look like a
    // real browser. The public CORS proxies fail this (and are additionally
    // blocked at the network layer in the E2E tests); the app's server-side
    // proxy sends browser headers and passes.
    const ua = req.headers['user-agent'] || '';
    if (!ua.includes('Mozilla')) {
      return send(res, 403, 'text/html',
        '<!DOCTYPE html><html><body><h1>403 Forbidden</h1><p>Automated access denied.</p></body></html>');
    }

    if (host === 'www.basic.gov.au') {
      if (path === '/robots.txt') {
        // First entry is dead — exercises multi-Sitemap fallback
        return send(res, 200, 'text/plain',
          `User-agent: *\nAllow: /\nSitemap: http://www.basic.gov.au:${GOV_PORT}/sitemap-old.xml\nSitemap: http://www.basic.gov.au:${GOV_PORT}/sitemap.xml\n`);
      }
      if (path === '/sitemap.xml') return send(res, 200, 'application/xml', urlset(host, BASIC_PATHS));
      if (path === '/huge.xml') return send(res, 200, 'application/xml', getHugeSitemap());
      if (path === '/head-405') {
        if (isHead) return send(res, 405, 'text/plain', '');
        return send(res, 200, 'text/html', crawlPage('HEAD-hostile page', []));
      }
      if (path === '/redirect-private') {
        return send(res, 302, 'text/plain', '', { Location: 'http://127.0.0.1:9/steal' });
      }
      if (path.startsWith('/page-')) {
        if (isHead) return send(res, 200, 'text/html', '');
        return send(res, 200, 'text/html', crawlPage(path, ['/page-1', '/page-2']));
      }
      return notFound(res);
    }

    if (host === 'www.index.gov.au') {
      if (path === '/robots.txt') {
        return send(res, 200, 'text/plain', `Sitemap: http://www.index.gov.au:${GOV_PORT}/sitemap.xml\n`);
      }
      if (path === '/sitemap.xml') {
        const page = url.searchParams.get('page');
        if (!page) {
          // Drupal simple_sitemap-style paginated index
          return send(res, 200, 'application/xml', `${XMLDECL}
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>http://www.index.gov.au:${GOV_PORT}/sitemap.xml?page=1</loc></sitemap>
  <sitemap><loc>http://www.index.gov.au:${GOV_PORT}/sitemap.xml?page=2</loc></sitemap>
  <sitemap><loc>http://www.index.gov.au:${GOV_PORT}/sitemap.xml?page=3</loc></sitemap>
</sitemapindex>`);
        }
        const paths = Array.from({ length: 25 }, (_, i) => `/section-${page}/item-${i + 1}`);
        return send(res, 200, 'application/xml', urlset(host, paths));
      }
      return notFound(res);
    }

    if (host === 'www.redirect.gov.au') {
      if (path === '/sitemap.xml') {
        return send(res, 301, 'text/plain', '', { Location: `http://www.basic.gov.au:${GOV_PORT}/sitemap.xml` });
      }
      return notFound(res);
    }

    if (host === 'www.nositemap.gov.au') {
      const pages = {
        '/': ['/about', '/services', '/contact'],
        '/about': ['/', '/about/team', '/services'],
        '/about/team': ['/', '/about'],
        '/services': ['/', '/services/permits', '/contact'],
        '/services/permits': ['/', '/services'],
        '/contact': ['/', '/about'],
      };
      if (path in pages || path === '') {
        const key = path || '/';
        if (isHead) return send(res, 200, 'text/html', '');
        return send(res, 200, 'text/html', crawlPage(key, pages[key]));
      }
      return notFound(res); // includes robots.txt and every sitemap location
    }

    return notFound(res);
  });

  return new Promise((resolve) => {
    server.listen(GOV_PORT, '127.0.0.1', () => resolve(server));
  });
}
