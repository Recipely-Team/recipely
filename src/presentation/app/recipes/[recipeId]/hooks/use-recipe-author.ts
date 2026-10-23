import { useEffect, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import type { RecipeAuthorInput } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-input';
import { CharConstants, ValueConstants } from '@core/constants';
import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';

/** The Kitchen's name is copy, read by the card at render time so it follows the language. */
const KITCHEN_AUTHOR: ResolvedAuthor = {
  authorName: CharConstants.empty,
  recipeCount: ValueConstants.zero,
  isOwner: false,
  isKitchen: true,
};

const KITCHEN: RecipeAuthorState = { status: StoreStatus.Resolved, author: KITCHEN_AUTHOR };
const LOADING: RecipeAuthorState = { status: StoreStatus.Loading };
const UNAVAILABLE: RecipeAuthorState = { status: StoreStatus.Unavailable };

/**
 * Resolves the public profile of a recipe's author for the detail-screen author
 * card. The owner case is resolved by the caller and passed via `owner`; any
 * other author is fetched here through the bag's `getUserProfile` use case keyed by
 * `ownerId`. A failed lookup yields `unavailable` so the screen can omit the
 * card rather than show a broken author. A Recipely Kitchen recipe is credited
 * to the Kitchen itself, with no lookup.
 */
export const useRecipeAuthor = ({
  ownerId,
  owner,
  isOwner,
  isKitchen = false,
}: RecipeAuthorInput): RecipeAuthorState => {
  const { getUserProfile } = useStores();
  // Tagged with the author it answers for, so a different author reads as loading until fetched.
  const [fetched, setFetched] = useState<{ ownerId: string; state: RecipeAuthorState } | null>(null);
  const lookupId =
    isKitchen || owner !== null || isOwner || ownerId === null || ownerId.length === ValueConstants.zero ? null : ownerId;

  useEffect(() => {
    if (lookupId === null) return;
    let isActive = true;
    void getUserProfile.execute({ userId: lookupId }).then((result) => {
      if (!isActive) return;
      setFetched({
        ownerId: lookupId,
        state: result.ok
          ? {
              status: StoreStatus.Resolved,
              author: {
                authorName: result.value.displayName,
                authorPhotoUrl: result.value.photoUrl ?? undefined,
                recipeCount: result.value.recipeCount,
                isOwner: false,
              },
            }
          : UNAVAILABLE,
      });
    });
    return () => {
      isActive = false;
    };
  }, [lookupId, getUserProfile]);

  if (isKitchen) return KITCHEN;
  if (owner !== null) return { status: StoreStatus.Resolved, author: owner };
  // Own recipe: wait for the caller to resolve the signed-in profile.
  if (isOwner) return LOADING;
  if (lookupId === null) return UNAVAILABLE;
  return fetched?.ownerId === lookupId ? fetched.state : LOADING;
};
