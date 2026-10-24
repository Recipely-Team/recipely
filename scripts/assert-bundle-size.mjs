/**
 * Fails the web build when its JavaScript grows past the budget (CLAUDE.md §29).
 *
 * @remarks
 * - **Why.** Every byte here is downloaded, parsed and run before the first
 *   screen on recipely.net, and nothing else noticed when a dependency or an
 *   eager import added a megabyte.
 * - **The budget sits just above today's size** (measured 2026-10-24: 7.74 MB
 *   raw, 1.89 MB gzip). Growing past it is a decision: raise the number in the
 *   same PR, with the reason in its description, as with coverage minimums.
 *
 * Usage: node scripts/assert-bundle-size.mjs dist
 */
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET = { rawBytes: 8_000_000, gzipBytes: 1_950_000 };

const dist = process.argv[2] ?? 'dist';
const jsDir = path.join(dist, '_expo/static/js/web');
if (!fs.existsSync(jsDir)) {
  console.error(`assert-bundle-size: ${jsDir} not found — run the web export first`);
  process.exit(1);
}

let raw = 0;
let gzip = 0;
for (const name of fs.readdirSync(jsDir).filter((file) => file.endsWith('.js'))) {
  const bytes = fs.readFileSync(path.join(jsDir, name));
  raw += bytes.length;
  gzip += gzipSync(bytes, { level: 9 }).length;
}

const mb = (n) => `${(n / 1_000_000).toFixed(2)} MB`;
const over = [];
if (raw > BUDGET.rawBytes) over.push(`raw ${mb(raw)} > ${mb(BUDGET.rawBytes)}`);
if (gzip > BUDGET.gzipBytes) over.push(`gzip ${mb(gzip)} > ${mb(BUDGET.gzipBytes)}`);
if (over.length > 0) {
  console.error(`assert-bundle-size: the web JavaScript is over budget (${over.join(', ')}). Find what grew, or raise BUDGET with the reason (CLAUDE.md §29).`);
  process.exit(1);
}
console.log(`assert-bundle-size: ${mb(raw)} raw, ${mb(gzip)} gzip — within budget`);
