import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';
import type { StoreStatus } from '@application/store/store-status';

export interface RecipeAuthorResolved {
  status: typeof StoreStatus.Resolved;
  author: ResolvedAuthor;
}
