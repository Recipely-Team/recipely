import { Difficulty } from '@domain/recipes/difficulty';

/**
 * Fixed English difficulty tag strings persisted on the recipe's `tags` field.
 * These are stored data (not UI copy), so they stay untranslated.
 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.Easy]: 'Easy',
  [Difficulty.Medium]: 'Medium',
  [Difficulty.Hard]: 'Hard',
};
