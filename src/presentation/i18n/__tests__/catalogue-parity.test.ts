/**
 * Every shipped language must be the SAME catalogue, differently worded.
 *
 * @remarks
 * TypeScript already guarantees the key set: `Translations` is
 * `DeepStringify<typeof en>`, so a catalogue missing a key does not compile.
 * What types cannot express is everything below — and it is exactly what bulk
 * translation gets wrong:
 *
 * - **Placeholders.** `{n}`, `{name}`, `{count}`, `{cuisine}`, `{value}` are
 *   substituted at runtime. A translator that renders `{count}` as `{cantidad}`
 *   produces a screen that literally says "{cantidad} recipes", and nothing
 *   fails until a user sees it.
 * - **Array arity.** `ideaChips` is rendered as a fixed row of suggestions;
 *   four chips where English has five leaves a hole in the layout.
 * - **Empty strings.** A key that was skipped comes back as `''` and renders as
 *   a blank button, which is worse than an untranslated one.
 *
 * Copy identical to English is NOT failed here — 'OK', 'Recipely' and 'Instagram'
 * are legitimately the same everywhere. It is reported as a count so a
 * catalogue that was silently pasted from English is visible in the output.
 */

import { ar } from '@presentation/i18n/locales/ar';
import { de } from '@presentation/i18n/locales/de';
import { en } from '@presentation/i18n/locales/en';
import { es } from '@presentation/i18n/locales/es';
import { fr } from '@presentation/i18n/locales/fr';
import { id } from '@presentation/i18n/locales/id';
// Aliased: the Italian catalogue is called `it`, which would shadow jest's own `it()`.
import { it as itCatalogue } from '@presentation/i18n/locales/it';
import { ja } from '@presentation/i18n/locales/ja';
import { pt } from '@presentation/i18n/locales/pt';
import { ru } from '@presentation/i18n/locales/ru';
import { tr } from '@presentation/i18n/locales/tr';
import type { Translations } from '@presentation/i18n/translations';

/** Every catalogue the app ships, by locale code. Add a language here when it lands. */
const CATALOGUES: Readonly<Record<string, Translations>> = {
  en, tr, es, pt, fr, de, it: itCatalogue, ru, id, ja, ar,
};

const PLACEHOLDER = /\{[a-zA-Z]+\}/g;

interface Entry {
  path: string;
  value: string;
}

/** Flattens a catalogue to `path → string`, expanding arrays as `path[i]`. */
const flatten = (node: unknown, prefix = ''): Entry[] => {
  if (typeof node === 'string') return [{ path: prefix, value: node }];
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => flatten(item, `${prefix}[${i}]`));
  }
  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, child]) =>
      flatten(child, prefix === '' ? key : `${prefix}.${key}`),
    );
  }
  return [];
};

const placeholdersOf = (value: string): string[] => [...(value.match(PLACEHOLDER) ?? [])].sort();

const enEntries = flatten(en);
const enByPath = new Map(enEntries.map((e) => [e.path, e.value]));

const otherLocales = Object.keys(CATALOGUES).filter((code) => code !== 'en');

describe.each(otherLocales)('the %s catalogue', (locale) => {
  const entries = flatten(CATALOGUES[locale]);
  const byPath = new Map(entries.map((e) => [e.path, e.value]));

  it('covers exactly the paths English has — no gaps, no extras', () => {
    // Arrays are the case types miss: `string[]` accepts any length, so a
    // five-chip row can come back with four and still compile.
    const missing = [...enByPath.keys()].filter((p) => !byPath.has(p));
    const extra = [...byPath.keys()].filter((p) => !enByPath.has(p));

    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it('keeps every placeholder exactly as English writes it', () => {
    const drifted = entries
      .filter((e) => {
        const source = enByPath.get(e.path);
        if (source === undefined) return false;
        return placeholdersOf(source).join() !== placeholdersOf(e.value).join();
      })
      .map((e) => ({
        path: e.path,
        expected: placeholdersOf(enByPath.get(e.path) ?? ''),
        got: placeholdersOf(e.value),
      }));

    expect(drifted).toEqual([]);
  });

  it('has no blank strings where English has copy', () => {
    const blank = entries
      .filter((e) => e.value.trim().length === 0)
      .filter((e) => (enByPath.get(e.path) ?? '').trim().length > 0)
      .map((e) => e.path);

    expect(blank).toEqual([]);
  });

  it('reports how much is still identical to English', () => {
    // Not a failure: 'OK', 'Recipely' and 'Instagram' are the same everywhere.
    // A HIGH number is the signal — it means a catalogue was pasted, not written.
    const identical = entries.filter((e) => enByPath.get(e.path) === e.value);
    const ratio = identical.length / entries.length;

    // Half a catalogue matching English is not a translation.
    expect({ locale, identical: identical.length, of: entries.length }).toMatchObject({ locale });
    expect(ratio).toBeLessThan(0.5);
  });
});
