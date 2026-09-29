import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the landing page's asset URLs.
 *
 * Two ways they break, neither visible to a test that only reads strings:
 * - **A path that points nowhere.** `/about` is served without a trailing slash,
 *   so every asset is written absolute (`/about/assets/landing/...`); a relative
 *   path, a typo or a deleted file 404s in production and nowhere else.
 * - **A stale cached file.** `firebase.json` serves js/css/images for a year as
 *   `immutable` while the HTML is `no-cache`, so an edited script without a new
 *   `?v=` pairs fresh markup with last year's code for returning visitors.
 *
 * The script builds some URLs from templates, so those are expanded from the
 * same data the script reads: the `data-shot` names in the markup for each
 * language, and the `img:` names in the recipe list.
 */
const PUBLIC = join(__dirname, '..', '..');
const HTML = readFileSync(join(PUBLIC, 'about', 'index.html'), 'utf8');
const ABOUT_JS = readFileSync(join(PUBLIC, 'about', 'assets', 'landing', 'about.js'), 'utf8');
const ABOUT_CSS = readFileSync(join(PUBLIC, 'about', 'assets', 'landing', 'about.css'), 'utf8');

const LANGUAGES = ['en', 'tr'];
const ASSET_URL = /\/about\/assets\/landing\/[^"'`)\s]+/g;
const VERSION = /\?v=\d+$/;

const literalUrls = (source: string): string[] =>
  [...source.matchAll(ASSET_URL)].map((m) => m[0]).filter((url) => !url.includes('${'));

const templatedUrls = (): string[] => {
  const shots = [...HTML.matchAll(/data-shot="([^"]+)"/g)].map((m) => m[1]);
  const photos = [...ABOUT_JS.matchAll(/img:'([^']+)'/g)].map((m) => m[1]);
  return [
    ...LANGUAGES.flatMap((lang) => shots.map((shot) => `/about/assets/landing/${lang}/${shot}.jpg?v=0`)),
    ...photos.map((photo) => `/about/assets/landing/${photo}?v=0`),
  ];
};

const onDisk = (url: string): string => join(PUBLIC, url.replace(/\?.*$/, ''));

describe('landing page assets', () => {
  const urls = [...literalUrls(HTML), ...literalUrls(ABOUT_JS), ...templatedUrls()];

  it('finds the asset URLs it is meant to check', () => {
    expect(urls.length).toBeGreaterThan(15);
  });

  it('points every asset URL at a file that ships', () => {
    const missing = urls.filter((url) => !existsSync(onDisk(url)));

    expect(missing).toEqual([]);
  });

  it('versions every asset URL, so an edit reaches returning visitors', () => {
    const unversioned = [...literalUrls(HTML), ...literalUrls(ABOUT_JS)].filter((url) => !VERSION.test(url));

    expect(unversioned).toEqual([]);
    expect(ABOUT_JS).toMatch(/\$\{e\.dataset\.shot\}\.jpg\?v=\d+/);
    expect(ABOUT_JS).toMatch(/\$\{r\.img\}\?v=\d+/);
    expect(ABOUT_CSS).toMatch(/panorama-lines\.svg\?v=\d+/);
  });
});
