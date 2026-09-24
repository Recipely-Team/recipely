import { RecipeOrigin, type RecipeOriginType } from '@domain/recipes/provenance/recipe-origin';

/**
 * The origin a wire value names, or `User` when it names none this app knows.
 *
 * Narrowing here rather than at each call site is what stops a future server
 * value from reaching a `switch` that has no case for it — the badge falls back
 * to the one that draws nothing, which is the safe way to be wrong.
 */
export const toRecipeOrigin = (value: string | undefined): RecipeOriginType =>
  value === RecipeOrigin.Ai || value === RecipeOrigin.Import ? value : RecipeOrigin.User;
