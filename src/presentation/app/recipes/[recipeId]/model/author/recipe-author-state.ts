import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';

export type RecipeAuthorState =
  | { status: 'loading' }
  | { status: 'resolved'; author: ResolvedAuthor }
  | { status: 'unavailable' };
