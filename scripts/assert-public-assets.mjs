#!/usr/bin/env node
/**
 * Asserts every file in `public/` survived the web export into `dist/`.
 *
 * Why this is worth a script: hosting rewrites `**` to `/index.html`, so a file
 * that failed to make it into `dist` is not a 404 — it answers **200 with the
 * SPA's HTML**. `curl -o /dev/null -w '%{http_code}'` says the asset is fine,
 * and every consumer that reads the BODY disagrees. That is not hypothetical
 * twice over: `prune-web-export` once deleted the legal pages this way and
 * /privacy silently became the app shell, and AdMob refused to verify app
 * ownership because it fetched app-ads.txt and got a web page.
 *
 * So the check is existence in `dist`, not reachability over HTTP — the one
 * question the rewrite cannot answer for us.
 */

import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = 'public';
const distDir = process.argv[2] ?? 'dist';

/** Every file under `dir`, as paths relative to it. */
const filesUnder = (dir, prefix = '') =>
  fs.readdirSync(path.join(dir, prefix), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory() ? filesUnder(dir, relative) : [relative];
  });

if (!fs.existsSync(PUBLIC_DIR)) process.exit(0);

const missing = filesUnder(PUBLIC_DIR).filter(
  (file) => !fs.existsSync(path.join(distDir, file)),
);

if (missing.length > 0) {
  console.error(
    `assert-public-assets — ${missing.length} file(s) from ${PUBLIC_DIR}/ are missing from ${distDir}/.\n` +
      'Hosting would answer these with the SPA shell and a 200, so nothing downstream would report it:\n',
  );
  for (const file of missing.sort()) console.error('  ' + file);
  process.exit(1);
}

console.log(`assert-public-assets — all ${filesUnder(PUBLIC_DIR).length} public file(s) present in ${distDir}`);
