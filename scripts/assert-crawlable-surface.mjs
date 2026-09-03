#!/usr/bin/env node
/**
 * Every route is either publisher content or is hidden from crawlers.
 *
 * AdSense judges "ads on screens without publisher content" per SITE, not per
 * ad placement. `check:structure` rule T already keeps the ad on the one screen
 * that earned it, and that was not enough: the notice arrived again while the
 * only ad on the origin sat on the feed. What Google could reach was the
 * problem — fourteen routes that render a form, a wizard or an account page,
 * every one of them crawlable, and the feed not even in the sitemap.
 *
 * So this asserts the classification itself. A route must be in exactly one of
 * two states, and adding a route without choosing one fails the build:
 *
 * - **Content** — listed in `public/sitemap.xml`. This is what the site offers
 *   readers, and what an ad may sit beside.
 * - **Not content** — `Disallow`ed in `public/robots.txt`. Sign-in, settings,
 *   the create wizard, the import queue.
 *
 * A dynamic route (`[param]`) cannot be enumerated in a sitemap, so it is
 * content when its parent segment is listed AND `firebase.json` rewrites it —
 * without a rewrite it answers 404 to a real visitor, which is the opposite
 * mistake and just as invisible from the source.
 *
 * Usage: node scripts/assert-crawlable-surface.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const APP_DIR = 'src/presentation/app';
const ROBOTS = 'public/robots.txt';
const SITEMAP = 'public/sitemap.xml';
const HOSTING = 'firebase.json';

/**
 * The routed pages, as url paths.
 *
 * Only `index.tsx` registers a route (architecture.md §Presentation structure),
 * so the scan looks for that file and nothing else — co-located `body/`,
 * `model/` and friends are not pages however many `.tsx` they hold.
 */
const routes = (dir, prefix = '') => {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('__')) continue;
    const child = path.join(dir, entry.name);
    if (fs.existsSync(path.join(child, 'index.tsx'))) found.push(`${prefix}/${entry.name}`);
    found.push(...routes(child, `${prefix}/${entry.name}`));
  }
  return found;
};

const declared = routes(APP_DIR);
const robots = fs.readFileSync(ROBOTS, 'utf8');
const sitemap = fs.readFileSync(SITEMAP, 'utf8');
const rewrites = JSON.stringify(JSON.parse(fs.readFileSync(HOSTING, 'utf8')).hosting);

const isDisallowed = (route) =>
  new RegExp(`^Disallow:\\s*${route}\\s*$`, 'm').test(robots);
const isListed = (route) => sitemap.includes(`${route}</loc>`);
const isRewritten = (route) => rewrites.includes(`"${route.replace(/\/\[[^\]]+\]$/, '/*')}"`);

const failures = [];

for (const route of declared) {
  const dynamic = route.endsWith(']');
  const parent = route.slice(0, route.lastIndexOf('/'));

  if (dynamic) {
    if (!isListed(parent)) {
      failures.push(`${route}: its parent ${parent} is not in the sitemap, so nothing links these pages`);
    }
    if (!isRewritten(route)) {
      failures.push(`${route}: no matching rewrite in ${HOSTING} — a real visitor gets a 404`);
    }
    continue;
  }

  const listed = isListed(route);
  const disallowed = isDisallowed(route);

  if (!listed && !disallowed) {
    failures.push(
      `${route}: classify it — add it to ${SITEMAP} if it is publisher content, ` +
        `or 'Disallow: ${route}' to ${ROBOTS} if it is not`,
    );
  }
  if (listed && disallowed) {
    failures.push(`${route}: both listed in ${SITEMAP} and disallowed in ${ROBOTS} — pick one`);
  }
}

if (failures.length > 0) {
  console.error(`assert-crawlable-surface — ${String(failures.length)} problem(s):\n`);
  for (const failure of failures) console.error('  ' + failure);
  process.exit(1);
}

console.log(`assert-crawlable-surface: ${String(declared.length)} route(s) classified`);
