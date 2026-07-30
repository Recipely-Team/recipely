import { t } from '@presentation/i18n';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import { SortKey } from '@presentation/app/recipes/model/sort-key';

/** Maps a UI sort key to the repository's `sort` filter value. */
export const SORT_TO_FILTER: Record<SortKey, RecipeFilters['sort']> = {
  popular: 'popular',
  rating: 'rating',
  time: 'time',
  newest: 'newest',
  mostLiked: 'mostLiked',
};

/** Localized labels for every {@link SortKey}, resolved at call time. */
export const sortKeyLabels = (): Record<SortKey, string> => ({
  popular: t().recipes.sortPopular,
  rating: t().recipes.sortRating,
  time: t().recipes.sortTime,
  newest: t().recipes.sortNewest,
  mostLiked: t().recipes.sortMostLiked,
});
