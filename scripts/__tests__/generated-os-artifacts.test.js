const fs = require('node:fs');
const path = require('node:path');

/**
 * Asserts what the two OS-surface generators actually WROTE.
 *
 * The freshness rules (`check:structure` AD and AE) import each generator, let
 * it rewrite its own files, and compare the result with itself — so any output
 * is "fresh" by construction. They catch a file out of step with its generator
 * and never a generator that is wrong, which is how a scheme-less deep link
 * shipped in four launcher shortcuts that did nothing when tapped.
 *
 * This reads the artifacts instead. It is deliberately independent of the
 * generators' internals: it makes the same demands Android, Apple and
 * `parseOsIntentLink` make, so a rewrite of either script has to keep passing.
 */
const ROOT = path.join(__dirname, '..', '..');
const SHORTCUTS = path.join(
  ROOT,
  'modules/recipely-assistant-kit/android/shortcuts/recipely_shortcuts.xml',
);
const ANDROID_RES = path.join(ROOT, 'modules/recipely-assistant-kit/android/src/main/res');
const IOS_RESOURCES = path.join(ROOT, 'modules/recipely-assistant-kit/ios/Resources');
const LOCALES = path.join(ROOT, 'src/presentation/i18n/locales');

const localeCodes = fs
  .readdirSync(LOCALES)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => name.replace(/\.ts$/, ''));

const read = (file) => fs.readFileSync(file, 'utf8');

describe('generated Android shortcuts', () => {
  const xml = read(SHORTCUTS);
  const links = [...xml.matchAll(/android:data="([^"]*)"/g)].map((m) => m[1]);

  it('gives every shortcut a link', () => {
    const ids = [...xml.matchAll(/android:shortcutId="([^"]*)"/g)].map((m) => m[1]);

    expect(links).toHaveLength(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  // Every VIEW filter on the launcher activity requires a scheme, so a link
  // without one matches NO_MATCH_DATA: the shortcut appears in the long-press
  // menu and does nothing at all when tapped.
  it.each([0, 1, 2, 3])('carries a scheme on link %i', (index) => {
    expect(links[index]).toMatch(/^[A-Za-z_][\w.+-]*:\/\//);
  });

  // The absent action of the open-ended entry was once rendered as the text
  // "null", producing a link asking the registry to run a word called "null".
  it('never spells an absent value as a word', () => {
    for (const link of links) {
      expect(link).not.toMatch(/=(null|undefined)(&|$)/);
    }
  });

  it('always carries the catalogue id, which the parser requires', () => {
    for (const link of links) {
      expect(link).toMatch(/[?&]id=[\w]+/);
    }
  });

  it('escapes the ampersand, because this is XML', () => {
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#)/);
  });
});

describe('generated Android labels', () => {
  // Android still uses the 1988 code for Indonesian. A `values-id` folder is
  // read as the REGION Indonesia, and every Indonesian label falls back to
  // English with nothing logged.
  it('writes Indonesian to values-in, never values-id', () => {
    expect(fs.existsSync(path.join(ANDROID_RES, 'values-in'))).toBe(true);
    expect(fs.existsSync(path.join(ANDROID_RES, 'values-id'))).toBe(false);
  });

  it('has a label folder for every shipped language', () => {
    for (const code of localeCodes) {
      const folder = code === 'en' ? 'values' : `values-${code === 'id' ? 'in' : code}`;
      expect({
        code,
        exists: fs.existsSync(path.join(ANDROID_RES, folder, 'recipely_shortcuts_strings.xml')),
      }).toEqual({ code, exists: true });
    }
  });

  it("escapes the apostrophe, which Android treats as a metacharacter", () => {
    for (const entry of fs.readdirSync(ANDROID_RES)) {
      if (!entry.startsWith('values')) continue;
      const file = path.join(ANDROID_RES, entry, 'recipely_shortcuts_strings.xml');
      if (!fs.existsSync(file)) continue;
      for (const m of read(file).matchAll(/<string name="[^"]*">([\s\S]*?)<\/string>/g)) {
        expect(m[1]).not.toMatch(/(^|[^\\])'/);
      }
    }
  });
});

describe('generated Siri phrases', () => {
  it('has a catalogue for every shipped language', () => {
    for (const code of localeCodes) {
      const file = path.join(IOS_RESOURCES, `${code}.lproj`, 'AppShortcuts.strings');
      expect({ code, exists: fs.existsSync(file) }).toEqual({ code, exists: true });
    }
  });

  // Apple drops a phrase that omits the application name, silently — and the
  // key has to be the English phrase verbatim or the lookup misses and Siri
  // answers in English everywhere.
  it('carries ${applicationName} on both sides of every line', () => {
    for (const code of localeCodes) {
      const lines = read(path.join(IOS_RESOURCES, `${code}.lproj`, 'AppShortcuts.strings'))
        .split('\n')
        .filter((line) => line.length > 0);
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        const [key, value] = line.split('" = "');
        expect({ code, key: key.includes('${applicationName}') }).toEqual({ code, key: true });
        expect({ code, value: value.includes('${applicationName}') }).toEqual({ code, value: true });
      }
    }
  });

  it('gives every language the same key set as English', () => {
    const keysOf = (code) =>
      [...read(path.join(IOS_RESOURCES, `${code}.lproj`, 'AppShortcuts.strings')).matchAll(/^"([^"]*)" = /gm)]
        .map((m) => m[1])
        .sort();
    const english = keysOf('en');

    for (const code of localeCodes) {
      expect({ code, keys: keysOf(code) }).toEqual({ code, keys: english });
    }
  });
});
