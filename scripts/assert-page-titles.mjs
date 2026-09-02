/**
 * Every exported page has exactly one `<title>`, and it says something.
 *
 * Config is not the artifact — the same lesson `check:structure` rule N learned
 * about `Info.plist`, applied to the web export. `+html.tsx` plainly contained
 * a correct `<title>` while the shipped HTML carried TWO: react-helmet-async is
 * mounted at the root by Expo Router and emits its own, seeded empty, BEFORE
 * anything the shell writes. `document.title` is the text of the first one, so
 * the site served a blank tab and handed a rendering crawler a nameless page —
 * with the right title sitting in the same `<head>`, a few elements down.
 *
 * Nothing could catch that from source: both halves were individually correct
 * and only their ORDER in the output was wrong. So this reads the output.
 *
 * Runs from `npm run build:web`, after the export.
 *
 * Usage: node scripts/assert-page-titles.mjs <dist-dir>
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2];
if (dist === undefined) {
  console.error('assert-page-titles: pass the export directory');
  process.exit(1);
}

/** Every `.html` the export produced, at any depth. */
const pages = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });

const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/g;
const failures = [];

for (const page of pages(dist)) {
  const where = path.relative(dist, page);
  const html = fs.readFileSync(page, 'utf8');
  const titles = [...html.matchAll(TITLE)].map((m) => m[1].trim());

  if (titles.length === 0) {
    failures.push(`${where}: no <title> at all`);
    continue;
  }
  if (titles.length > 1) {
    // Order is the whole bug: a browser reads the FIRST one, so a second
    // correct title does not rescue an empty first.
    failures.push(`${where}: ${String(titles.length)} <title> elements — a browser reads only the first`);
  }
  if (titles[0] === '') {
    failures.push(`${where}: the first <title> is empty — this is the blank browser tab`);
  }
}

if (failures.length > 0) {
  console.error(`assert-page-titles — ${String(failures.length)} problem(s):\n`);
  for (const failure of failures) console.error('  ' + failure);
  process.exit(1);
}
console.log(`assert-page-titles — OK (${String(pages(dist).length)} pages)`);
