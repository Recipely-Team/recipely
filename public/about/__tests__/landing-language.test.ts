/**
 * @jest-environment jsdom
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { TextDecoder, TextEncoder } from 'util';

/**
 * Guards the landing page's first-load language.
 *
 * The bug: a Turkish visitor opening recipely.net/about for the first time got
 * the English page. The script defaulted to English and only ever looked at
 * localStorage, so the browser's own language was never consulted — and the
 * switch in the header was the only way to find the Turkish copy.
 *
 * The page is plain scripts loaded by `<script>` tags, so it is exercised the
 * same way the browser does: load the real markup, then evaluate the strings
 * file and the page script in order.
 */
const ABOUT = join(__dirname, '..');
const HTML = readFileSync(join(ABOUT, 'index.html'), 'utf8');
const STRINGS_JS = readFileSync(join(ABOUT, 'assets', 'landing', 'about-i18n.js'), 'utf8');
const ABOUT_JS = readFileSync(join(ABOUT, 'assets', 'landing', 'about.js'), 'utf8');

const STORAGE_KEY = 'rcp.lang';

/** jsdom lacks matchMedia; the page only asks whether motion is reduced and the scheme is dark. */
const stubBrowserApis = (): void => {
  // jest-expo's URL polyfill needs these; jsdom does not provide them.
  Object.assign(globalThis, { TextEncoder, TextDecoder });
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduced-motion'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
};

const runLanding = (languages: readonly string[], stored?: string, search = ''): void => {
  document.documentElement.innerHTML = HTML.replace(/^[\s\S]*?<html[^>]*>/i, '').replace(/<\/html>\s*$/i, '');
  document.documentElement.setAttribute('lang', 'en');
  localStorage.clear();
  if (stored !== undefined) localStorage.setItem(STORAGE_KEY, stored);
  window.history.replaceState(null, '', `/about${search}`);
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true });
  Object.defineProperty(window.navigator, 'language', { value: languages[0], configurable: true });
  stubBrowserApis();
  new Function(STRINGS_JS)();
  new Function(ABOUT_JS)();
};

const activeLang = (): string | null =>
  document.querySelector('[data-lang][aria-pressed="true"]')?.getAttribute('data-lang') ?? null;

const heroSub = (): string => document.querySelector('[data-i18n="hero.sub"]')?.textContent ?? '';

describe('landing page first-load language', () => {
  beforeEach(() => {
    // The demos chain setTimeout; without fake timers they keep firing after
    // the test finishes and log into a torn-down environment.
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('opens in Turkish for a Turkish browser — the reported bug', () => {
    runLanding(['tr-TR', 'en-US']);

    expect(activeLang()).toBe('tr');
    expect(document.documentElement.lang).toBe('tr');
    expect(heroSub()).toMatch(/^Konuş ya da yaz\./);
  });

  it('opens in English for any language the page does not speak', () => {
    runLanding(['de-DE', 'fr-FR']);

    expect(activeLang()).toBe('en');
    expect(heroSub()).toMatch(/^Talk or type\./);
  });

  it('respects the browser preference order rather than hunting for Turkish', () => {
    runLanding(['en-GB', 'tr']);

    expect(activeLang()).toBe('en');
  });

  it('lets a stored choice outrank the browser', () => {
    runLanding(['tr-TR'], 'en');

    expect(activeLang()).toBe('en');
  });

  it('lets ?lang= in a shared link outrank everything', () => {
    runLanding(['en-US'], 'en', '?lang=tr');

    expect(activeLang()).toBe('tr');
  });

  it('does not persist the detected language, so a browser change is re-read', () => {
    runLanding(['tr-TR']);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists the language the visitor picks', () => {
    runLanding(['tr-TR']);
    document.querySelector<HTMLButtonElement>('[data-lang="en"]')?.click();

    expect(activeLang()).toBe('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('shows the Turkish screenshots on a Turkish page', () => {
    runLanding(['tr-TR']);

    const shots = [...document.querySelectorAll<HTMLImageElement>('img[data-shot]')].map((img) => img.getAttribute('src'));
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every((src) => src?.startsWith('/about/assets/landing/tr/'))).toBe(true);
  });
});
