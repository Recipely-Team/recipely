/**
 * @jest-environment jsdom
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the landing page's first-load language.
 *
 * The bug: a Turkish visitor opening recipely.net/about for the first time got
 * the English page. The script defaulted to `var startLang = 'en'` and only ever
 * looked at localStorage, so the browser's own language was never consulted —
 * and the switch in the header was the only way to find the Turkish copy.
 *
 * The page is a plain IIFE loaded by a `<script>` tag, so it is exercised the
 * same way the browser does: build the DOM it expects, then evaluate the file.
 */
const LANDING_JS = readFileSync(join(__dirname, '..', 'assets', 'landing.js'), 'utf8');

const STORAGE_KEY = 'recipely-landing-lang';

/** The parts of the page this script's language pass touches. */
const MARKUP = `
  <div class="seg" data-lang-seg aria-label="Language">
    <button data-lang="en" class="on">EN</button>
    <button data-lang="tr">TR</button>
  </div>
  <h1 data-en="All your recipes in one place." data-tr="Tüm tarifler tek bir yerde.">All your recipes in one place.</h1>
`;

const runLanding = (languages: readonly string[], stored?: string): void => {
  document.documentElement.removeAttribute('lang');
  document.body.innerHTML = MARKUP;
  localStorage.clear();
  if (stored !== undefined) localStorage.setItem(STORAGE_KEY, stored);
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true });
  Object.defineProperty(window.navigator, 'language', { value: languages[0], configurable: true });
  new Function(LANDING_JS)();
};

const activeLang = (): string | null =>
  document.querySelector('[data-lang-seg] button.on')?.getAttribute('data-lang') ?? null;

const heading = (): string => document.querySelector('h1')?.textContent ?? '';

describe('landing page first-load language', () => {
  beforeEach(() => {
    // The AI typing demo chains setTimeout; without fake timers it keeps firing
    // after the test finishes and logs into a torn-down environment.
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
    expect(heading()).toBe('Tüm tarifler tek bir yerde.');
  });

  it('opens in English for any language the page does not speak', () => {
    runLanding(['de-DE', 'fr-FR']);

    expect(activeLang()).toBe('en');
    expect(heading()).toBe('All your recipes in one place.');
  });

  it('respects the browser preference order rather than hunting for Turkish', () => {
    runLanding(['en-GB', 'tr']);

    expect(activeLang()).toBe('en');
  });

  it('lets a stored choice outrank the browser', () => {
    runLanding(['tr-TR'], 'en');

    expect(activeLang()).toBe('en');
  });

  it('does not persist the detected language, so a browser change is re-read', () => {
    runLanding(['tr-TR']);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists the language the visitor picks', () => {
    runLanding(['tr-TR']);
    document.querySelector<HTMLButtonElement>('[data-lang-seg] button[data-lang="en"]')?.click();

    expect(activeLang()).toBe('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});
