#!/usr/bin/env node
// Government-website test harness orchestrator.
//
//   npm run test:gov          mock-mode: unit + browser-fetch + E2E suites
//   LIVE=1 npm run test:gov   also hit real gov.au domains (needs internet)
//
// Mock mode exercises the REAL serverless handler code (compiled from
// api/*.ts) and the REAL production frontend build against a local origin
// that reproduces documented gov.au behavior: bot filtering by user-agent,
// blocked public CORS proxies, multi-entry robots.txt, paginated sitemap
// indexes, redirects, and sitemap-less sites that require crawling.
//
// Requirements: /etc/hosts entries mapping the mock hostnames to 127.0.0.1
// (added automatically when running as root) and a Chromium binary
// (CHROMIUM_EXECUTABLE_PATH, default /opt/pw-browsers/chromium).

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { buildApi, API_BUILD_DIR } from './build-api.mjs';
import { startMockGovServer, MOCK_HOSTS } from './mock-gov-server.mjs';
import { startAppServer, APP_PORT } from './app-server.mjs';
import { runUnitTests, runBrowserFetchTests } from './unit-tests.mjs';
import { runE2eTests } from './e2e-tests.mjs';
import { runLiveTests } from './live-tests.mjs';

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(harnessDir, '..', '..');
const distDir = join(repoRoot, 'dist');

const CHROMIUM = process.env.CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium';

const log = (msg) => console.log(`[gov-harness] ${msg}`);

function ensureHosts() {
  const hostsFile = '/etc/hosts';
  const current = readFileSync(hostsFile, 'utf8');
  const missing = MOCK_HOSTS.filter(h => !current.includes(h));
  if (missing.length === 0) return;
  try {
    appendFileSync(hostsFile, `\n# sitemap-viewer gov-harness\n${missing.map(h => `127.0.0.1 ${h}`).join('\n')}\n`);
    log(`added ${missing.length} mock hostnames to /etc/hosts`);
  } catch {
    console.error(`Cannot write /etc/hosts. Add these lines manually and re-run:\n${missing.map(h => `127.0.0.1 ${h}`).join('\n')}`);
    process.exit(1);
  }
}

function report(title, results) {
  console.log(`\n=== ${title} ===`);
  for (const r of results) {
    const suffix = r.detail ? ` — ${r.detail}` : r.error ? ` — ${r.error}` : '';
    console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${suffix}`);
  }
  return results.every(r => r.pass);
}

async function main() {
  const liveMode = process.env.LIVE === '1';

  // 1. Fresh production build of the frontend
  if (!existsSync(distDir) || process.env.SKIP_BUILD !== '1') {
    log('building frontend (npm run build)...');
    execSync('npm run build', { cwd: repoRoot, stdio: 'pipe' });
  }

  // 2. Compile the real serverless functions
  log('compiling api/*.ts with esbuild...');
  buildApi();

  // 3. Environment for the harness servers
  ensureHosts();
  process.env.CHROMIUM_EXECUTABLE_PATH = CHROMIUM;

  // 4. Start mock gov origin + app/api server
  const govServer = await startMockGovServer();
  const appServer = await startAppServer({ distDir, apiBuildDir: API_BUILD_DIR });
  log(`mock gov origin on :8091, app+api on :${APP_PORT}`);

  let allPass = true;
  try {
    // 5. Handler-level unit tests (guards OFF/ON toggled inside)
    allPass = report('fetch-proxy handler tests', await runUnitTests({ apiBuildDir: API_BUILD_DIR })) && allPass;

    // 6. browser-fetch through real Chromium (trust env needed for target validation-free fetch)
    process.env.FETCH_PROXY_TRUST_HOSTS = '.gov.au';
    allPass = report('browser-fetch handler tests', await runBrowserFetchTests({ apiBuildDir: API_BUILD_DIR })) && allPass;

    // 7. Full E2E through the production frontend
    allPass = report('gov-site E2E scenarios', await runE2eTests({ chromiumPath: CHROMIUM })) && allPass;

    // 8. Optional live domains
    if (liveMode) {
      delete process.env.FETCH_PROXY_TRUST_HOSTS; // real DNS, real guards
      const live = await runLiveTests({ apiBuildDir: API_BUILD_DIR });
      if (live.skipped) {
        console.log(`\n=== live gov.au domains ===\n  SKIPPED — ${live.reason}`);
        if (live.results.length) {
          for (const r of live.results) console.log(`    ${r.detail || r.name}`);
        }
      } else {
        console.log(`\n=== live gov.au domains (${live.reachableCount} retrieved server-side) ===`);
        for (const r of live.results) {
          console.log(`  ${r.pass ? 'OK  ' : 'FAIL'}  ${r.name} — ${r.detail}`);
          if (!r.pass) allPass = false;
        }
      }
    } else {
      console.log('\n(live gov.au checks skipped — run with LIVE=1 on a networked machine)');
    }
  } finally {
    govServer.close();
    appServer.close();
  }

  console.log(`\n${allPass ? 'ALL SUITES PASSED' : 'FAILURES DETECTED'}`);
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error('[gov-harness] fatal:', err);
  process.exit(1);
});
