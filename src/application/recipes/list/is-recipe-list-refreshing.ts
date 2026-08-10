import type { RecipeListState } from '@application/recipes/list/recipe-list-state';
import { StoreStatus } from '@application/store/store-status';

/**
 * True while an already-`loaded` recipe list is being refetched in the
 * background (`state.isRefreshing`) — whatever triggered it: a filter/sort
 * change, a locale switch, a screen focus, or a user pull-to-refresh.
 *
 * Drives the web inline refresh indicator. NOT suitable for a mobile
 * `RefreshControl.refreshing`: on iOS a programmatic `refreshing` animates the
 * scroll view down and back, so a filter tap would look like a jump. The mobile
 * pull-to-refresh spinner tracks its own pull-initiated flag instead.
 */
export const isRecipeListRefreshing = (state: RecipeListState): boolean =>
  state.status === StoreStatus.Loaded && state.isRefreshing === true;
