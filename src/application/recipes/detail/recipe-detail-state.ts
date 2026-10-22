import type { RecipeDetailIdle } from '@application/recipes/detail/states/recipe-detail-idle';
import type { RecipeDetailLoading } from '@application/recipes/detail/states/recipe-detail-loading';
import type { RecipeDetailLoaded } from '@application/recipes/detail/states/recipe-detail-loaded';
import type { RecipeDetailError } from '@application/recipes/detail/states/recipe-detail-error';

export type RecipeDetailState =
  | RecipeDetailIdle
  | RecipeDetailLoading
  | RecipeDetailLoaded
  | RecipeDetailError;
