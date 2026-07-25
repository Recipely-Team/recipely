import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';

export interface RecipeAuthorInput {
  /** The recipe's `ownerId`, or null when the recipe itself is unresolved. */
  ownerId: string | null;
  /**
   * The signed-in user as the author, supplied by the caller for an owned
   * recipe (so name/photo come from the session and the count from the shared
   * profile store). When the recipe is owned but this is still null, the hook
   * stays in `loading` rather than fetching — the owner is never looked up here.
   */
  owner: ResolvedAuthor | null;
  /** True when the recipe is owned by the signed-in user. */
  isOwner: boolean;
}
