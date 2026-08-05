// Compile the TypeScript serverless functions to plain ESM so the harness
// can import and execute the real handler code.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(harnessDir, '..', '..');

export const API_BUILD_DIR = join(harnessDir, '.build');

export function buildApi() {
  esbuild.buildSync({
    entryPoints: [
      join(repoRoot, 'api', 'fetch-proxy.ts'),
      join(repoRoot, 'api', 'browser-fetch.ts'),
    ],
    outdir: API_BUILD_DIR,
    bundle: true, // inlines api/_security.ts
    platform: 'node',
    format: 'esm',
    target: 'node18',
    // Heavy runtime deps stay external and resolve from the repo's node_modules
    external: ['playwright-core', '@sparticuz/chromium'],
    banner: {
      // import.meta.url-based createRequire so external CJS deps resolve under ESM
      js: `import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);`,
    },
    logLevel: 'warning',
  });
  return API_BUILD_DIR;
}
