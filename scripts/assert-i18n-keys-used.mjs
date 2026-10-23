/**
 * Every translation key is read by the app, or by the tooling that ships it.
 *
 * Dead copy is invisible: it type-checks, passes the 14-locale parity test and
 * costs a translation every time a language is added. A sweep found 26 such
 * keys (364 lines across the catalogues) left behind by features that changed.
 *
 * A key counts as used when its leaf name appears in app code, the native
 * modules or the build scripts — deliberately loose, because text is often
 * read through an alias (`const strings = t.mealPlan`). A section read with
 * brackets (`t.assistant.actions[action]`) counts as used whole.
 *
 * Runs from `npm run check:structure`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const CATALOGUE = 'src/presentation/i18n/locales/en.ts';
const source = fs.readFileSync(CATALOGUE, 'utf8');
const sf = ts.createSourceFile(CATALOGUE, source, ts.ScriptTarget.Latest, true);
const leaves = [];
const walk = (node, trail) => {
  if (ts.isObjectLiteralExpression(node)) {
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const name = property.name.getText(sf).replace(/['"]/g, '');
      if (ts.isObjectLiteralExpression(property.initializer)) walk(property.initializer, [...trail, name]);
      else leaves.push([...trail, name]);
    }
    return;
  }
  ts.forEachChild(node, (child) => walk(child, trail));
};
walk(sf, []);

const files = execSync("git ls-files 'src/**/*.ts' 'src/**/*.tsx' 'scripts/**' 'modules/**/*.swift' 'modules/**/*.kt' 'ios/**/*.swift'", { encoding: 'utf8' })
  .split('\n')
  .filter((file) => file && fs.existsSync(file) && !file.includes('/i18n/locales/') && !file.includes('__tests__') && file !== 'scripts/assert-i18n-keys-used.mjs');
const corpus = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const mentions = (name) => new RegExp(`(?<![\\w$])${name}(?![\\w$])`).test(corpus);
/** Sections the native intents and the shortcuts generator read whole, by section name. */
const WHOLE_SECTIONS = new Set(['osIntentStrings']);
const indexed = (section) => new RegExp(`(?<![\\w$])${section}\\s*\\[`).test(corpus);

const unused = leaves.filter((trail) => {
  const parent = trail[trail.length - 2];
  const [section] = trail;
  if (section !== undefined && WHOLE_SECTIONS.has(section) && mentions(section)) return false;
  return !mentions(trail[trail.length - 1]) && !(parent !== undefined && indexed(parent));
});

if (unused.length > 0) {
  console.error(`assert-i18n-keys-used — ${String(unused.length)} translation key(s) nothing reads:\n`);
  for (const trail of unused) console.error('  ' + trail.join('.'));
  console.error('\nRemove them from every catalogue (i18n-copy skill), or use them.');
  process.exit(1);
}
console.log(`assert-i18n-keys-used — OK (${String(leaves.length)} keys)`);
