import type { RecipeListIdle } from '@application/recipes/list/states/recipe-list-idle';
import type { RecipeListLoading } from '@application/recipes/list/states/recipe-list-loading';
import type { RecipeListLoaded } from '@application/recipes/list/states/recipe-list-loaded';
import type { RecipeListError } from '@application/recipes/list/states/recipe-list-error';

export type RecipeListState =
  | RecipeListIdle
  | RecipeListLoading
  | RecipeListLoaded
  | RecipeListError;
