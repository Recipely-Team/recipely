import type { RecipeAuthorLoading } from '@presentation/app/recipes/[recipeId]/model/author/states/recipe-author-loading';
import type { RecipeAuthorResolved } from '@presentation/app/recipes/[recipeId]/model/author/states/recipe-author-resolved';
import type { RecipeAuthorUnavailable } from '@presentation/app/recipes/[recipeId]/model/author/states/recipe-author-unavailable';

export type RecipeAuthorState =
  | RecipeAuthorLoading
  | RecipeAuthorResolved
  | RecipeAuthorUnavailable;
