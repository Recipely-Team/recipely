import { t } from '@presentation/i18n';
import { Difficulty } from '@domain/recipes/difficulty';

/** Resolves a {@link Difficulty} enum value to its localized display label. */
export const difficultyLabel = (difficulty: Difficulty): string => {
  const labels: Record<Difficulty, string> = {
    [Difficulty.Easy]: t().recipes.difficultyEasy,
    [Difficulty.Medium]: t().recipes.difficultyMedium,
    [Difficulty.Hard]: t().recipes.difficultyHard,
  };
  return labels[difficulty];
};
