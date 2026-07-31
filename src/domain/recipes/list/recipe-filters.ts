import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeSortType } from '@domain/recipes/list/recipe-sort-type';

export interface RecipeFilters {
  /**
   * 1-based page to fetch, matching the API. Absent means the first page —
   * every caller used to mean that whether it wanted to or not.
   */
  page?: number;
  search?: string;
  // Opaque taxonomy keys (backend owns the full catalog); not narrowed to the
  // local enums so newer backend cuisines/categories can be filtered on.
  cuisines?: string[];
  categories?: string[];
  difficulties?: Difficulty[];
  maxTime?: number;
  sort?: RecipeSortType;
  sortOrder?: 'asc' | 'desc';
}
