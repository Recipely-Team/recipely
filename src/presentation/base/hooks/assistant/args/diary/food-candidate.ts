import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { FoodSourceType } from '@presentation/base/hooks/assistant/args/diary/food-source';

/**
 * Something the user may mean by a food's name: a listed recipe (its macros
 * need the full recipe) or a food already loggable as it is.
 */
export type FoodCandidate =
  | { kind: 'recipe'; source: FoodSourceType; name: string; kcal: number; recipe: RecipeSummaryEntity }
  | { kind: 'food'; source: FoodSourceType; name: string; kcal: number; food: LoggableFood };
