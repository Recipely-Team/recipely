/**
 * Fails when the phone apps would claim a recipely.net page that is not a
 * shared recipe or creator page.
 *
 * Why: Android's app link filter claimed the WHOLE domain, and iOS's
 * apple-app-site-association claimed `*`. Someone signing in on recipely.net in
 * an Android browser was pulled into the app mid-flow — the redirect back to
 * the site opened the app — and could not finish on the web. Only the pages
 * people share belong to the app: `/recipes/<id>` and `/creators/<id>`, the two
 * URLs `recipeWebUrl` / `creatorWebUrl` build.
 *
 * Usage: node scripts/assert-app-links.mjs
 */
import fs from 'node:fs';

const SHARED = ['/recipes/', '/creators/'];
const HOST = 'recipely.net';
const failures = [];

const app = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const filters = (app.android?.intentFilters ?? []).filter((f) =>
  (f.data ?? []).some((d) => d.scheme === 'https' && d.host === HOST),
);
for (const filter of filters) {
  for (const data of filter.data ?? []) {
    if (data.host !== HOST) continue;
    if (data.path !== undefined || data.pathPattern !== undefined) {
      failures.push(`app.json: Android filter uses path/pathPattern; use pathPrefix from ${SHARED.join(', ')}`);
    } else if (!SHARED.includes(data.pathPrefix)) {
      failures.push(`app.json: Android claims ${HOST}${data.pathPrefix ?? ' (the whole domain)'} — only ${SHARED.join(', ')}`);
    }
  }
}
const androidPrefixes = filters.flatMap((f) => (f.data ?? []).map((d) => d.pathPrefix)).sort();

const aasa = JSON.parse(fs.readFileSync('public/.well-known/apple-app-site-association', 'utf8'));
for (const detail of aasa.applinks.details) {
  const expected = SHARED.map((p) => `${p}*`).sort();
  const paths = [...detail.paths].sort();
  if (JSON.stringify(paths) !== JSON.stringify(expected)) {
    failures.push(`apple-app-site-association (${detail.appID}): paths ${JSON.stringify(detail.paths)} — expected ${JSON.stringify(expected)}`);
  }
}
if (JSON.stringify(androidPrefixes) !== JSON.stringify([...SHARED].sort())) {
  failures.push(`Android claims ${JSON.stringify(androidPrefixes)}, iOS claims ${JSON.stringify(SHARED)} — keep them the same`);
}

if (failures.length > 0) {
  console.error(`assert-app-links — ${String(failures.length)} problem(s):\n  · ${failures.join('\n  · ')}`);
  process.exit(1);
}
console.log(`assert-app-links: the apps claim only ${SHARED.join(', ')} on ${HOST}`);
