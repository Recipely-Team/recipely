import type { TrendingRecipesIdle } from '@application/recipes/trending/states/trending-recipes-idle';
import type { TrendingRecipesLoading } from '@application/recipes/trending/states/trending-recipes-loading';
import type { TrendingRecipesLoaded } from '@application/recipes/trending/states/trending-recipes-loaded';
import type { TrendingRecipesError } from '@application/recipes/trending/states/trending-recipes-error';

export type TrendingRecipesState =
  | TrendingRecipesIdle
  | TrendingRecipesLoading
  | TrendingRecipesLoaded
  | TrendingRecipesError;
