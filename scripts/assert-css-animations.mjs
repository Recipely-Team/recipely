/**
 * Every CSS animation a prerendered page uses is defined in that page.
 *
 * The web skeleton cards sat frozen until the bundle hydrated: the static
 * export wrote `animation: recipely-shimmer …` onto every placeholder, but the
 * `@keyframes` rule was only ever injected by script, and scripts do not run
 * during the export. A name with no keyframes is not an error to a browser —
 * the animation simply does not run — so nothing else would notice.
 *
 * Pages from `public/` do not run the app and are skipped: only pages that load
 * the `_expo` bundle count.
 *
 * Runs from `npm run build:web`, after the export.
 *
 * Usage: node scripts/assert-css-animations.mjs <dist-dir>
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2];
if (dist === undefined) {
  console.error('assert-css-animations: pass the export directory');
  process.exit(1);
}

const APP_BUNDLE = /<script src="\/_expo\/static\/js\//;
// `animation: name 1.2s …` or `animation-name: name`, in a style attribute or a stylesheet.
const ANIMATION_USE = /animation(?:-name)?\s*:\s*([A-Za-z_][\w-]*)/g;
const KEYWORDS = new Set(['none', 'inherit', 'initial', 'unset', 'revert']);

/** Every `.html` the export produced, at any depth. */
const pages = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });

const failures = [];
let checked = 0;

for (const page of pages(dist)) {
  const html = fs.readFileSync(page, 'utf8');
  if (!APP_BUNDLE.test(html)) continue;
  checked += 1;
  const used = new Set([...html.matchAll(ANIMATION_USE)].map((match) => match[1]).filter((name) => !KEYWORDS.has(name)));
  for (const name of used) {
    if (!html.includes(`@keyframes ${name}`)) {
      failures.push(`${path.relative(dist, page)}: uses animation "${name}" but defines no @keyframes ${name} — it stays frozen until the bundle runs`);
    }
  }
}

if (checked === 0) failures.push('no page loads the app bundle — the export or this check is broken');

if (failures.length > 0) {
  console.error(`assert-css-animations — ${String(failures.length)} problem(s):\n`);
  for (const failure of failures) console.error('  ' + failure);
  process.exit(1);
}
console.log(`assert-css-animations — OK (${String(checked)} app pages)`);
