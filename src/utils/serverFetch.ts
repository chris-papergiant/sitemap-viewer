// Routing helpers for sites that block public CORS proxies.
//
// Government sites (.gov.au especially) detect and block the public CORS
// proxy services the app normally fetches through, while responding fine to
// direct server-side requests (see VICHEALTH_FINAL_ANALYSIS.md). For those
// domains we skip the public proxies and go through our own serverless
// endpoint (/api/fetch-proxy) first.

const PROTECTED_SUFFIXES = [
  '.gov.au',
  '.gov.nz',
  '.gov.uk',
  '.gov',
  '.mil',
  '.edu.au',
];

export const isProtectedSite = (url: string): boolean => {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname.toLowerCase();
    return PROTECTED_SUFFIXES.some(
      suffix => hostname.endsWith(suffix) || hostname === suffix.slice(1)
    );
  } catch {
    return false;
  }
};

export interface ServerFetchResult {
  content: string;
  status: number;
  /** Status of the first response, before any redirects were followed */
  initialStatus?: number;
  redirected?: boolean;
  /** Vendor label if a bot-management firewall block was detected, else null */
  botWall?: string | null;
  contentType?: string;
  finalUrl?: string;
}

/**
 * Raised when a bot-management firewall (Cloudflare, Akamai, ...) blocks the
 * request. These blocks are keyed on the server's IP reputation, so they hit
 * every datacenter-hosted fetch path — there is no point retrying other
 * proxies or falling back to the crawler. Callers should stop and explain.
 */
export class BotWallError extends Error {
  vendor: string;
  hostname: string;
  constructor(vendor: string, hostname: string) {
    super(`${vendor} bot firewall blocked access to ${hostname}`);
    this.name = 'BotWallError';
    this.vendor = vendor;
    this.hostname = hostname;
  }
}

const hostOf = (url: string): string => {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
};

/**
 * Fetch a URL through our own serverless proxy (/api/fetch-proxy).
 * Throws on network failure; completed HTTP responses (including 4xx/5xx)
 * are returned with their status so callers can decide what to do.
 */
export const fetchViaServerProxy = async (
  url: string,
  options?: { signal?: AbortSignal; headOnly?: boolean }
): Promise<ServerFetchResult> => {
  const params = new URLSearchParams({ url });
  if (options?.headOnly) {
    params.set('head', '1');
  }

  const response = await fetch(`/api/fetch-proxy?${params.toString()}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`Server proxy unavailable: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Server proxy fetch failed');
  }

  return {
    content: data.content ?? '',
    status: data.status,
    initialStatus: data.initialStatus,
    redirected: data.redirected,
    botWall: data.botWall,
    contentType: data.contentType,
    finalUrl: data.url,
  };
};

/**
 * Like fetchViaServerProxy, but treats HTTP error statuses as failures and
 * raises BotWallError when a firewall block is detected (so callers can stop
 * the whole fallback cascade instead of retrying paths that will also fail).
 */
export const fetchTextViaServerProxy = async (
  url: string,
  signal?: AbortSignal
): Promise<string> => {
  const result = await fetchViaServerProxy(url, { signal });
  if (result.botWall) {
    throw new BotWallError(result.botWall, hostOf(url));
  }
  if (result.status >= 400) {
    throw new Error(`HTTP ${result.status}`);
  }
  return result.content;
};
