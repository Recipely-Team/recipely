import type { Difficulty } from '@domain/recipes/difficulty';

/**
 * The recipe-list screen's in-UI filter selection (cuisines, categories,
 * difficulties, and a max total-time cap). Mapped to {@link RecipeFilters} for
 * the API on apply; `maxTime === 0` means "any".
 */
export interface UiFilters {
  cuisines: string[];
  categories: string[];
  difficulties: Difficulty[];
  maxTime: number;
}
