import type { RefineRecipeIdle } from '@application/recipes/refine/states/refine-recipe-idle';
import type { RefiningRecipe } from '@application/recipes/refine/states/refining-recipe';
import type { RecipeRefined } from '@application/recipes/refine/states/recipe-refined';
import type { RefineRecipeError } from '@application/recipes/refine/states/refine-recipe-error';

export type RefineRecipeState =
  | RefineRecipeIdle
  | RefiningRecipe
  | RecipeRefined
  | RefineRecipeError;
