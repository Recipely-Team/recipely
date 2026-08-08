import { en } from '@presentation/i18n/locales/en';
import { tr } from '@presentation/i18n/locales/tr';

type Bundle = Record<string, unknown>;

/**
 * Flattens a translation bundle to the sorted set of dotted leaf paths
 * (e.g. `recipes.filtersAndSort`, `errors.network.title`), so two locales can be
 * compared for structural parity regardless of declaration order.
 */
const leafPaths = (bundle: Bundle, prefix = ''): string[] => {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(bundle)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      paths.push(...leafPaths(value as Bundle, path));
    } else {
      paths.push(path);
    }
  }
  return paths.sort();
};

describe('i18n locale sync (en ↔ tr)', () => {
  const enPaths = leafPaths(en as unknown as Bundle);
  const trPaths = leafPaths(tr as unknown as Bundle);

  it('defines the same set of keys in both locales', () => {
    const missingInTr = enPaths.filter((p) => !trPaths.includes(p));
    const extraInTr = trPaths.filter((p) => !enPaths.includes(p));

    expect(missingInTr).toEqual([]);
    expect(extraInTr).toEqual([]);
  });

  it('keeps blank strings symmetric across locales', () => {
    // `login.hint` is an intentional empty placeholder; whatever is blank in en
    // must be blank in tr (and vice versa), so a copy edit can't silently leave
    // one locale empty while the other gains text.
    const blankPaths = (bundle: Bundle, prefix = ''): string[] => {
      const blanks: string[] = [];
      for (const [key, value] of Object.entries(bundle)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object') {
          blanks.push(...blankPaths(value as Bundle, path));
        } else if (typeof value === 'string' && value.trim().length === 0) {
          blanks.push(path);
        }
      }
      return blanks.sort();
    };

    expect(blankPaths(en as unknown as Bundle)).toEqual(blankPaths(tr as unknown as Bundle));
  });

  it('includes the recipes.filtersAndSort key in both locales', () => {
    expect(enPaths).toContain('recipes.filtersAndSort');
    expect(trPaths).toContain('recipes.filtersAndSort');
    expect(en.recipes.filtersAndSort.length).toBeGreaterThan(0);
    expect(tr.recipes.filtersAndSort.length).toBeGreaterThan(0);
  });
});
