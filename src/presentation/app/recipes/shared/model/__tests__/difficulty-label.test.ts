/**
 * Tests for difficulty-label.ts — the pure helper that maps a `Difficulty`
 * value to a localized string.
 *
 * `t()` defaults to the English bundle in the test environment (no initLocale /
 * mocking required; the i18n module initialises `currentLang` to 'en').
 *
 * `DIFFICULTY_VALUES` is used as the exhaustive source of truth so that adding
 * a new `Difficulty` value without updating the label map causes a test failure.
 */

import { Difficulty, DIFFICULTY_VALUES } from '@domain/recipes/difficulty';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';

describe('difficultyLabel()', () => {
  it('returns a non-empty string for every Difficulty value', () => {
    for (const difficulty of DIFFICULTY_VALUES) {
      const label = difficultyLabel(difficulty);

      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('covers all values in DIFFICULTY_VALUES — no missing Difficulty is silently ignored', () => {
    // If a Difficulty is added to DIFFICULTY_VALUES but missing from the label
    // map, difficultyLabel() would return undefined (not a string).
    const results = DIFFICULTY_VALUES.map((d) => difficultyLabel(d));

    const undefined_results = results.filter((r) => r === undefined);

    expect(undefined_results).toHaveLength(0);
  });

  it("returns 'Easy' for Difficulty.Easy in the English locale", () => {
    const label = difficultyLabel(Difficulty.Easy);

    expect(label).toBe('Easy');
  });

  it("returns 'Medium' for Difficulty.Medium in the English locale", () => {
    const label = difficultyLabel(Difficulty.Medium);

    expect(label).toBe('Medium');
  });

  it("returns 'Hard' for Difficulty.Hard in the English locale", () => {
    const label = difficultyLabel(Difficulty.Hard);

    expect(label).toBe('Hard');
  });

  it('produces distinct labels so difficulties are distinguishable', () => {
    const labels = DIFFICULTY_VALUES.map((d) => difficultyLabel(d));
    const unique = new Set(labels);

    expect(unique.size).toBe(DIFFICULTY_VALUES.length);
  });
});
