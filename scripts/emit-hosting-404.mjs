#!/usr/bin/env node
/**
 * Gives the export a real 404 page for Firebase Hosting to serve.
 *
 * The hosting config used to end in a catch-all rewrite (`**` → `/index.html`),
 * so EVERY url on the origin answered 200 with the empty app shell —
 * `/asdfqwer`, `/login.php`, `/recipes/999999`, all of them, 34 KB of chrome
 * and nine words of text. That is a soft 404, and to a crawler it is an
 * unbounded supply of "screens with no content", which is the wording of the
 * AdSense notice the site was served twice.
 *
 * With the catch-all scoped to the routes that genuinely need it, Firebase
 * falls back to `404.html` in the deploy root and answers with a real 404.
 * Expo Router already exports the app's own not-found screen; this copies it
 * into the name Firebase looks for rather than authoring a second one that
 * would drift from it.
 *
 * Runs from `npm run build:web`, after the export and the prune.
 *
 * Usage: node scripts/emit-hosting-404.mjs [dist]
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] ?? 'dist';
const source = path.join(dist, '+not-found.html');
const target = path.join(dist, '404.html');

if (!fs.existsSync(source)) {
  console.error(`emit-hosting-404: ${source} is missing — did the export emit +not-found?`);
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log(`emit-hosting-404: wrote ${target}`);
