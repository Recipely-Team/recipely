/**
 * Every page the app prerenders ships its icon fonts in `<head>`.
 *
 * An `@expo/vector-icons` glyph renders an empty `<Text />` until its font is
 * registered. When nothing registered the fonts before render, the static
 * export drew every icon empty, the browser drew real glyphs as soon as the
 * first icon mounted, and React threw error #418 (hydration mismatch) on every
 * tab route. `useIconFonts` in the root layout registers them up front; on the
 * server that is what puts `<style id="expo-generated-fonts">` into the page.
 * Its absence in the output is the bug, whatever the source looks like — so
 * this reads the output.
 *
 * Pages from `public/` (the about site, legal pages, offline fallback) do not
 * run the app and are skipped: only pages that load the `_expo` bundle count.
 *
 * Runs from `npm run build:web`, after the export.
 *
 * Usage: node scripts/assert-icon-fonts.mjs <dist-dir>
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2];
if (dist === undefined) {
  console.error('assert-icon-fonts: pass the export directory');
  process.exit(1);
}

/** The `font` keys of the icon families `use-icon-fonts.ts` registers. */
const ICON_FONT_FAMILIES = ['ionicons', 'material-community'];
// One family per icon set the hook registers: adding a set there without its family here fails the build.
const HOOK = fs.readFileSync(path.join(process.cwd(), 'src/presentation/navigation/use-icon-fonts.ts'), 'utf8');
const registeredSets = (HOOK.match(/from '@expo\/vector-icons\/[A-Za-z]+'/g) ?? []).length;
if (registeredSets !== ICON_FONT_FAMILIES.length) {
  console.error(`assert-icon-fonts: use-icon-fonts.ts registers ${String(registeredSets)} icon set(s) but this check knows ${String(ICON_FONT_FAMILIES.length)} family name(s) — add the new family to ICON_FONT_FAMILIES`);
  process.exit(1);
}
const APP_BUNDLE = /<script src="\/_expo\/static\/js\//;
const FONT_STYLE = /<style id="expo-generated-fonts">([\s\S]*?)<\/style>/;

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
  const where = path.relative(dist, page);
  const css = FONT_STYLE.exec(html)?.[1];
  if (css === undefined) {
    failures.push(`${where}: no <style id="expo-generated-fonts"> — icons were prerendered empty`);
    continue;
  }
  for (const family of ICON_FONT_FAMILIES) {
    if (!css.includes(`font-family:${JSON.stringify(family)}`)) failures.push(`${where}: no @font-face for "${family}"`);
  }
}

if (checked === 0) failures.push('no page loads the app bundle — the export or this check is broken');

if (failures.length > 0) {
  console.error(`assert-icon-fonts — ${String(failures.length)} problem(s):\n`);
  for (const failure of failures) console.error('  ' + failure);
  process.exit(1);
}
console.log(`assert-icon-fonts — OK (${String(checked)} app pages)`);
