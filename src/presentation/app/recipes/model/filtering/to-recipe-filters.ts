import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import { SORT_TO_FILTER } from '@presentation/app/recipes/model/sorting/recipe-sort';
import type { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { ValueConstants } from '@core/constants';

/**
 * The feed's request: the screen's filters, sort and query as the API takes them.
 *
 * @remarks
 * - **The query is an argument**, not something closed over: the feed's focus
 *   and language reloads would otherwise refire on every debounced keystroke
 *   and send a duplicate request.
 * - **Empty filters are left out**, so the backend's defaults apply.
 */
export const toRecipeFilters = (filters: UiFilters, sort: SortKey, query: string): RecipeFilters => ({
  ...(query.length > ValueConstants.zero ? { search: query } : {}),
  ...(filters.cuisines.length > ValueConstants.zero ? { cuisines: filters.cuisines } : {}),
  ...(filters.categories.length > ValueConstants.zero ? { categories: filters.categories } : {}),
  ...(filters.difficulties.length > ValueConstants.zero ? { difficulties: filters.difficulties } : {}),
  ...(filters.maxTime > ValueConstants.zero ? { maxTime: filters.maxTime } : {}),
  sort: SORT_TO_FILTER[sort],
});
