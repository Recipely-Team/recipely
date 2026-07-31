import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeSortType } from '@domain/recipes/list/recipe-sort-type';

/**
 * Query string of `GET /recipes`, as the backend reads it.
 *
 * Multi-value filters arrive comma-joined, which is the one transport detail
 * this shape carries — it is why the type says `string` where the domain says
 * `string[]`, and why building it belongs in a mapper rather than in the
 * repository method that was assembling it with a stack of `if`s.
 */
export interface RecipeListQueryDto {
  page: number;
  pageSize: number;
  search?: string;
  /** Comma-joined cuisine keys. */
  cuisines?: string;
  /** Comma-joined category keys. */
  categories?: string;
  /** Comma-joined difficulty keys. */
  difficulties?: Difficulty[] | string;
  maxTime?: number;
  sort?: RecipeSortType;
  sortOrder?: 'asc' | 'desc';
}
