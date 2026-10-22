import type { LikedRecipesListIdle } from '@application/recipes/liked/states/liked-recipes-list-idle';
import type { LikedRecipesListLoading } from '@application/recipes/liked/states/liked-recipes-list-loading';
import type { LikedRecipesListLoaded } from '@application/recipes/liked/states/liked-recipes-list-loaded';
import type { LikedRecipesListError } from '@application/recipes/liked/states/liked-recipes-list-error';

/**
 * The "Liked" grid's load.
 *
 * @remarks
 * The `Idle` / `Loaded` split is what tells an empty grid apart from an
 * unanswered one — without it the tab flashes "you have liked nothing" while
 * its first request is still in flight.
 */
export type LikedRecipesListState =
  | LikedRecipesListIdle
  | LikedRecipesListLoading
  | LikedRecipesListLoaded
  | LikedRecipesListError;
