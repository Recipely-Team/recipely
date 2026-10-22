import type { SavedRecipesListIdle } from '@application/recipes/saved/states/saved-recipes-list-idle';
import type { SavedRecipesListLoading } from '@application/recipes/saved/states/saved-recipes-list-loading';
import type { SavedRecipesListLoaded } from '@application/recipes/saved/states/saved-recipes-list-loaded';
import type { SavedRecipesListError } from '@application/recipes/saved/states/saved-recipes-list-error';

/**
 * The "Saved" grid's load.
 *
 * @remarks
 * The `Idle` / `Loaded` split is what tells an empty grid apart from an
 * unanswered one — see {@link MyRecipesListState} for the flash of "nothing
 * saved" this exists to prevent.
 */
export type SavedRecipesListState =
  | SavedRecipesListIdle
  | SavedRecipesListLoading
  | SavedRecipesListLoaded
  | SavedRecipesListError;
