#!/usr/bin/env node
/**
 * Renders the PWA icon set into `public/icons/` from the same art the native
 * apps use, so the installed web app wears the launcher icon rather than a
 * lookalike that drifts from it.
 *
 * Two purposes, because they are two different pictures:
 *   - `any`     — the mark with its own breathing room, drawn on white. This is
 *                 what a browser tab, a task-switcher and a shortcut show.
 *   - `maskable`— full-bleed brand orange with the mark inside the safe zone,
 *                 composited from the Android adaptive pair. A launcher crops
 *                 this to whatever shape the OS likes (circle, squircle, teardrop),
 *                 so anything outside the middle 80% must be background only.
 *                 Handing a transparent `any` icon to a masking launcher is what
 *                 produces a mark floating in a grey blob.
 *
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public/icons');
const SRC = path.join(ROOT, 'assets/images');

/** `android.adaptiveIcon.backgroundColor` in app.json — one brand, one value. */
const BRAND = '#EE8941';
/** Chrome wants both; 192 is the install prompt, 512 the splash and store surfaces. */
const SIZES = [192, 512];

const flattenedOnWhite = (file, size) =>
  sharp(path.join(SRC, file))
    .resize(size, size, { fit: 'contain', background: '#FFFFFF' })
    .flatten({ background: '#FFFFFF' })
    .png();

const maskable = async (size) => {
  const background = await sharp(path.join(SRC, 'android-icon-background.png'))
    .resize(size, size)
    .toBuffer();
  const foreground = await sharp(path.join(SRC, 'android-icon-foreground.png'))
    .resize(size, size)
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: background }, { input: foreground }])
    .png();
};

fs.mkdirSync(OUT, { recursive: true });

for (const size of SIZES) {
  await flattenedOnWhite('icon.png', size).toFile(path.join(OUT, `icon-${size}.png`));
  await (await maskable(size)).toFile(path.join(OUT, `icon-maskable-${size}.png`));
}

// iOS ignores the manifest's icons and reads `apple-touch-icon`, which is also
// composited on an opaque background — a transparent one renders black there.
await flattenedOnWhite('icon.png', 180).toFile(path.join(OUT, 'apple-touch-icon.png'));

console.log(`generate-pwa-icons — wrote ${SIZES.length * 2 + 1} icons to public/icons/`);
