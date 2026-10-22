import type { GenerateRecipeIdle } from '@application/recipes/generate/states/generate-recipe-idle';
import type { GeneratingRecipe } from '@application/recipes/generate/states/generating-recipe';
import type { RecipeGenerated } from '@application/recipes/generate/states/recipe-generated';
import type { GenerateRecipeError } from '@application/recipes/generate/states/generate-recipe-error';

export type GenerateRecipeState =
  | GenerateRecipeIdle
  | GeneratingRecipe
  | RecipeGenerated
  | GenerateRecipeError;
