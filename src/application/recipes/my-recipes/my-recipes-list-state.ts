import type { MyRecipesListIdle } from '@application/recipes/my-recipes/states/my-recipes-list-idle';
import type { MyRecipesListLoading } from '@application/recipes/my-recipes/states/my-recipes-list-loading';
import type { MyRecipesListLoaded } from '@application/recipes/my-recipes/states/my-recipes-list-loaded';
import type { MyRecipesListError } from '@application/recipes/my-recipes/states/my-recipes-list-error';

/**
 * The "Created" grid's load.
 *
 * @remarks
 * `Idle` and `Loaded` are deliberately distinct even though both can carry an
 * empty `recipes`: without the difference the screen cannot tell "you have
 * published nothing" from "the answer has not arrived yet", and it rendered the
 * empty state for both — a flash of "no recipes" on every cold open.
 */
export type MyRecipesListState =
  | MyRecipesListIdle
  | MyRecipesListLoading
  | MyRecipesListLoaded
  | MyRecipesListError;
