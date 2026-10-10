import type { Difficulty } from '@domain/recipes/difficulty';

/**
 * One recipe idea from what the user has — a read model, not a recipe yet.
 *
 * `uses` are the user's ingredients it cooks with; `missing` (at most five)
 * are what they would still have to buy.
 */
export interface FridgeIdea {
  readonly title: string;
  readonly summary: string;
  readonly totalMinutes: number;
  readonly difficulty: Difficulty;
  readonly uses: readonly string[];
  readonly missing: readonly string[];
}
