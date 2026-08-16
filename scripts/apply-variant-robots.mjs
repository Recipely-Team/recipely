#!/usr/bin/env node
/**
 * Keeps the dev web deploy out of search engines.
 *
 * public/robots.txt is the production policy (allow all + sitemap) and is
 * copied verbatim into every export. The dev site (dev.recipely.net) must not
 * be indexed, so when the export was built with APP_VARIANT=development this
 * rewrites dist/robots.txt to disallow everything and drops the sitemap
 * (its URLs point at the production origin anyway). Complemented by the
 * X-Robots-Tag: noindex header on the app-recipely-dev hosting target in
 * firebase.json — robots.txt alone doesn't de-index already-discovered URLs.
 *
 * Usage: node scripts/apply-variant-robots.mjs [dist]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Files this script deliberately removes from a development export.
 *
 * Exported because `assert-public-assets` checks that everything in `public/`
 * reached `dist/`, and would otherwise report this deletion as the very bug it
 * exists to catch. One definition, read by both — the alternative is two
 * scripts holding the same fact and disagreeing the day one changes.
 */
export const DEV_VARIANT_REMOVALS = ['sitemap.xml'];

const main = () => {
  const dist = process.argv[2] ?? 'dist';
  if (!fs.existsSync(dist)) {
    console.error(`apply-variant-robots: '${dist}' does not exist`);
    process.exit(1);
  }

  if (process.env.APP_VARIANT !== 'development') {
    console.log('apply-variant-robots: production variant — robots.txt untouched');
    process.exit(0);
  }

  fs.writeFileSync(path.join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  for (const name of DEV_VARIANT_REMOVALS) fs.rmSync(path.join(dist, name), { force: true });
  console.log('apply-variant-robots: dev variant — robots.txt set to disallow-all, sitemap dropped');
};

// Run only when invoked as a script. `assert-public-assets` imports this module
// for the list above, and ESM has no `require.main`, so compare resolved URLs.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
