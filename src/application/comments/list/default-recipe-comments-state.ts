import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { ValueConstants } from '@core/constants';

/** Returns the empty per-recipe comments state used before any load. */
export const defaultRecipeCommentsState = (): RecipeCommentsState => ({
  items: [],
  total: ValueConstants.zero,
  page: 1,
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  error: null,
});
