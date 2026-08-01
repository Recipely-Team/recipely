import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { ValueConstants } from '@core/constants';

/** Returns the empty per-recipe comments state used before any load. */
export const defaultRecipeCommentsState = (): RecipeCommentsState => ({
  items: [],
  total: ValueConstants.zero,
  page: 1, // TO DO: Static sayı coredaki constants dosyasına taşınabilir.
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  error: null,
});
