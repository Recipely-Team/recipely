/**
 * Every inline script the web export ships is allowed by hash in the CSP, and no
 * page carries an inline event handler.
 *
 * The production `Content-Security-Policy` (firebase.json, every hosting target)
 * allows scripts from our origin, a short list of Google/Apple hosts, and the
 * exact `sha256-…` of each inline `<script>` we wrote: the service-worker
 * registration in `+html.tsx`, Expo Router's hydrate flag, and the small scripts
 * in `public/` pages (about, offline, legal). An injected script matches none of
 * them, which is the point. The cost is that editing one of those scripts changes
 * its hash, and the browser would then silently refuse to run it — so the build
 * reads the output and fails instead.
 *
 * `onclick="…"` and friends are inline script too, and hashes do not cover them
 * without `'unsafe-hashes'`; a page must attach listeners from its script.
 *
 * Runs from `npm run build:web`, after the export. `--write` rewrites the hashes
 * in firebase.json from the export (run it after changing an inline script).
 *
 * Usage: node scripts/assert-csp-inline-scripts.mjs <dist-dir> [--write]
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2];
const write = process.argv.includes('--write');
if (dist === undefined) {
  console.error('assert-csp-inline-scripts: pass the export directory');
  process.exit(1);
}

const pages = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });

const SCRIPT = /<script([^>]*)>([\s\S]*?)<\/script>/g;
const HANDLER = /\son[a-z]+\s*=\s*["']/i;
const isExecutable = (attrs) => !/\bsrc\s*=/.test(attrs) && !/type\s*=\s*["']application\/(ld\+)?json["']/.test(attrs);

const hashes = new Map();
const failures = [];
for (const page of pages(dist)) {
  const html = fs.readFileSync(page, 'utf8');
  const where = path.relative(dist, page);
  for (const [, attrs, body] of html.matchAll(SCRIPT)) {
    if (!isExecutable(attrs)) continue;
    const hash = `'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`;
    if (!hashes.has(hash)) hashes.set(hash, where);
  }
  const withoutScripts = html.replace(SCRIPT, '');
  if (HANDLER.test(withoutScripts.replace(/<!--[\s\S]*?-->/g, ''))) {
    failures.push(`${where}: inline event handler (on…="…") — attach the listener from the page's script; the CSP blocks inline handlers`);
  }
}

const FIREBASE = path.join(process.cwd(), 'firebase.json');
const firebase = JSON.parse(fs.readFileSync(FIREBASE, 'utf8'));
const targets = Array.isArray(firebase.hosting) ? firebase.hosting : [firebase.hosting];
const cspOf = (target) =>
  (target.headers ?? [])
    .filter((h) => h.source === '**')
    .flatMap((h) => h.headers)
    .find((h) => h.key === 'Content-Security-Policy');

for (const target of targets) {
  const csp = cspOf(target);
  if (csp === undefined) {
    failures.push(`firebase.json (${target.target}): no Content-Security-Policy on "**"`);
    continue;
  }
  if (write) {
    csp.value = csp.value.replace(
      /(script-src [^;]*?)((?: 'sha256-[A-Za-z0-9+/=]+')*)(;|$)/,
      (_, head, _old, end) => `${head.trimEnd()} ${[...hashes.keys()].sort().join(' ')}${end}`,
    );
    continue;
  }
  const scriptSrc = /script-src ([^;]*)/.exec(csp.value)?.[1] ?? '';
  for (const [hash, where] of hashes) {
    if (!scriptSrc.includes(hash)) {
      failures.push(`firebase.json (${target.target}): script-src lacks ${hash} for the inline script in ${where} — run: node scripts/assert-csp-inline-scripts.mjs dist --write`);
    }
  }
}

if (write) {
  fs.writeFileSync(FIREBASE, `${JSON.stringify(firebase, null, 2)}\n`);
  console.log(`assert-csp-inline-scripts: wrote ${String(hashes.size)} hash(es) into firebase.json`);
  process.exit(0);
}
if (failures.length > 0) {
  console.error(`assert-csp-inline-scripts — ${String(failures.length)} problem(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`assert-csp-inline-scripts — OK (${String(hashes.size)} inline script(s), all allowed by hash)`);
