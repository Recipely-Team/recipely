import { t } from '@presentation/i18n';
import { Difficulty } from '@domain/recipes/difficulty';

/**
 * Resolves a {@link Difficulty} value to its localized display label.
 *
 * @remarks
 * - **Matched case-insensitively**, and an unknown value is shown as it came:
 *   the field arrives from the wire as a plain string, so "easy" or a fourth
 *   level a newer backend grows must still print something rather than nothing.
 */
export const difficultyLabel = (difficulty: Difficulty): string => {
  const labels: Readonly<Record<string, string>> = {
    [Difficulty.Easy]: t().recipes.difficultyEasy,
    [Difficulty.Medium]: t().recipes.difficultyMedium,
    [Difficulty.Hard]: t().recipes.difficultyHard,
  };
  return labels[difficulty.toUpperCase()] ?? difficulty;
};
