import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { FIRST_PAGE } from '@infrastructure/constants/api';
import { ValueConstants } from '@core/constants';

/** Returns the empty per-recipe comments state used before any load. */
export const defaultRecipeCommentsState = (): RecipeCommentsState => ({
  items: [],
  total: ValueConstants.zero,
  page: FIRST_PAGE,
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  error: null,
});
