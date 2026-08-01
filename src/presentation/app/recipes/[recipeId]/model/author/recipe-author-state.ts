import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';
import type { StoreStatus } from '@application/store/store-status';

export type RecipeAuthorState =
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Resolved; author: ResolvedAuthor }
  | { status: typeof StoreStatus.Unavailable };
