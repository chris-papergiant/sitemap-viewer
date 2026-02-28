import { SitemapEntry } from './sitemapParser';

export interface VerificationResult {
  url: string;
  status: 'ok' | 'error' | 'redirect' | 'pending';
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
}

export interface VerificationReport {
  total: number;
  checked: number;
  ok: number;
  errors: number;
  redirects: number;
  results: VerificationResult[];
  isComplete: boolean;
}

const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
];

/**
 * Verify a sample of URLs from a sitemap to check they're accessible.
 * Uses HEAD-like requests via CORS proxies.
 */
export async function verifySitemapUrls(
  urls: SitemapEntry[],
  sampleSize: number = 20,
  onProgress?: (report: VerificationReport) => void
): Promise<VerificationReport> {
  // Take a random sample, always including the first URL (homepage)
  const indices = new Set<number>([0]);
  while (indices.size < Math.min(sampleSize, urls.length)) {
    indices.add(Math.floor(Math.random() * urls.length));
  }
  const sample = Array.from(indices).map(i => urls[i]);

  const report: VerificationReport = {
    total: urls.length,
    checked: 0,
    ok: 0,
    errors: 0,
    redirects: 0,
    results: sample.map(u => ({ url: u.loc, status: 'pending' as const })),
    isComplete: false,
  };

  // Check URLs in batches of 5
  const batchSize = 5;
  for (let i = 0; i < sample.length; i += batchSize) {
    const batch = sample.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(entry => checkUrl(entry.loc))
    );

    batchResults.forEach((result, j) => {
      const idx = i + j;
      if (result.status === 'fulfilled') {
        report.results[idx] = result.value;
        if (result.value.status === 'ok') report.ok++;
        else if (result.value.status === 'error') report.errors++;
        else if (result.value.status === 'redirect') report.redirects++;
      } else {
        report.results[idx] = {
          url: batch[j].loc,
          status: 'error',
          error: 'Verification failed',
        };
        report.errors++;
      }
      report.checked++;
    });

    onProgress?.({ ...report, results: [...report.results] });
  }

  report.isComplete = true;
  onProgress?.({ ...report, results: [...report.results] });
  return report;
}

async function checkUrl(url: string): Promise<VerificationResult> {
  for (const proxy of CORS_PROXIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(proxy + encodeURIComponent(url), {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Range': 'bytes=0-0' }, // Only fetch 1 byte
      });

      const status = response.status;
      response.body?.cancel();

      if (response.ok || status === 206) {
        return { url, status: 'ok', statusCode: status };
      }
      if (status >= 300 && status < 400) {
        return {
          url,
          status: 'redirect',
          statusCode: status,
          redirectUrl: response.headers.get('location') || undefined,
        };
      }
      return { url, status: 'error', statusCode: status };
    } catch {
      continue;
    } finally {
      clearTimeout(timeout);
    }
  }
  return { url, status: 'error', error: 'All proxies failed' };
}
