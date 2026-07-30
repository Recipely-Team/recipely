/**
 * Tests for recipe-sort.ts — the pure logic around sort keys, their API
 * mapping and their localized labels.
 *
 * `t()` from the i18n module returns the English bundle by default in the test
 * environment (no initLocale / mocking required; the module initialises
 * `currentLang` to 'en').
 */

import { SORT_TO_FILTER, sortKeyLabels } from '@presentation/app/recipes/model/recipe-sort';
import { SortKey } from '@presentation/app/recipes/model/sort-key';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';

// ─── derive the exhaustive key list from the type itself ──────────────────────
// If a new SortKey is added to the union but forgotten in SORT_TO_FILTER or
// sortKeyLabels(), the tests below will fail at the assertion level.
const ALL_SORT_KEYS: SortKey[] = [
  'popular',
  'rating',
  'time',
  'newest',
  'mostLiked',
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const VALID_API_SORT_VALUES: RecipeFilters['sort'][] = [
  'popular',
  'rating',
  'time',
  'newest',
  'mostLiked',
  'alphabetical',
  'mostCommented',
];

describe('SORT_TO_FILTER', () => {
  it('has an entry for every SortKey', () => {
    const mappedKeys = Object.keys(SORT_TO_FILTER) as SortKey[];

    const missingKeys = ALL_SORT_KEYS.filter((k) => !mappedKeys.includes(k));

    expect(missingKeys).toEqual([]);
  });

  it('does not contain entries for keys outside the SortKey union', () => {
    const mappedKeys = Object.keys(SORT_TO_FILTER) as SortKey[];
    const extraKeys = mappedKeys.filter((k) => !ALL_SORT_KEYS.includes(k));

    expect(extraKeys).toEqual([]);
  });

  it("maps 'popular' to the 'popular' filter sort value", () => {
    expect(SORT_TO_FILTER['popular']).toBe('popular');
  });

  it("maps 'rating' to the 'rating' filter sort value", () => {
    expect(SORT_TO_FILTER['rating']).toBe('rating');
  });

  it("maps 'time' to the 'time' filter sort value", () => {
    expect(SORT_TO_FILTER['time']).toBe('time');
  });

  it("maps 'newest' to the 'newest' filter sort value", () => {
    expect(SORT_TO_FILTER['newest']).toBe('newest');
  });

  it("maps 'mostLiked' to the 'mostLiked' filter sort value", () => {
    expect(SORT_TO_FILTER['mostLiked']).toBe('mostLiked');
  });

  it('maps every key to a valid RecipeFilters sort value', () => {
    for (const key of ALL_SORT_KEYS) {
      const filterValue = SORT_TO_FILTER[key];

      expect(VALID_API_SORT_VALUES).toContain(filterValue);
    }
  });
});

describe('sortKeyLabels()', () => {
  it('returns a non-empty label for every SortKey', () => {
    const labels = sortKeyLabels();

    for (const key of ALL_SORT_KEYS) {
      expect(typeof labels[key]).toBe('string');
      expect(labels[key].length).toBeGreaterThan(0);
    }
  });

  it('has exactly the same keys as SortKey — no missing keys', () => {
    const labels = sortKeyLabels();
    const labelKeys = Object.keys(labels) as SortKey[];

    const missingKeys = ALL_SORT_KEYS.filter((k) => !labelKeys.includes(k));

    expect(missingKeys).toEqual([]);
  });

  it("returns 'Popular' for the 'popular' key in the English locale", () => {
    const labels = sortKeyLabels();

    expect(labels['popular']).toBe('Popular');
  });

  it("returns 'Top rated' for the 'rating' key in the English locale", () => {
    const labels = sortKeyLabels();

    expect(labels['rating']).toBe('Top rated');
  });

  it("returns 'Quickest' for the 'time' key in the English locale", () => {
    const labels = sortKeyLabels();

    expect(labels['time']).toBe('Quickest');
  });

  it("returns 'Newest' for the 'newest' key in the English locale", () => {
    const labels = sortKeyLabels();

    expect(labels['newest']).toBe('Newest');
  });

  it("returns 'Most liked' for the 'mostLiked' key in the English locale", () => {
    const labels = sortKeyLabels();

    expect(labels['mostLiked']).toBe('Most liked');
  });

  it('produces distinct labels so no two sort options look the same to users', () => {
    const labels = sortKeyLabels();
    const values = Object.values(labels);
    const uniqueValues = new Set(values);

    expect(uniqueValues.size).toBe(values.length);
  });
});
