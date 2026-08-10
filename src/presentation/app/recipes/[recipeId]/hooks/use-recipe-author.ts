import { useEffect, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import type { RecipeAuthorInput } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-input';
import { ValueConstants } from '@core/constants';

/**
 * Resolves the public profile of a recipe's author for the detail-screen author
 * card. The owner case is resolved by the caller and passed via `owner`; any
 * other author is fetched here through {@link GetUserProfileUseCase} keyed by
 * `ownerId`. A failed lookup yields `unavailable` so the screen can omit the
 * card rather than show a broken author.
 */
export const useRecipeAuthor = ({
  ownerId,
  owner,
  isOwner,
}: RecipeAuthorInput): RecipeAuthorState => {
  const [state, setState] = useState<RecipeAuthorState>({ status: StoreStatus.Loading });

  useEffect(() => {
    if (owner !== null) {
      setState({ status: StoreStatus.Resolved, author: owner });
      return;
    }
    // Owned recipe whose own profile has not resolved yet: hold on loading
    // instead of fetching — the signed-in user's profile is the caller's job.
    if (isOwner) {
      setState({ status: StoreStatus.Loading });
      return;
    }
    if (ownerId === null || ownerId.length === ValueConstants.zero) {
      setState({ status: StoreStatus.Unavailable });
      return;
    }

    let active = true;
    setState({ status: StoreStatus.Loading });
    const useCase = container.resolve<GetUserProfileUseCase>(
      TOKENS.GetUserProfileUseCase,
    );
    void useCase.execute({ userId: ownerId }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setState({ status: StoreStatus.Unavailable });
        return;
      }
      setState({
        status: StoreStatus.Resolved,
        author: {
          authorName: result.value.displayName,
          authorPhotoUrl: result.value.photoUrl ?? undefined,
          recipeCount: result.value.recipeCount,
          isOwner: false,
        },
      });
    });

    return () => {
      active = false;
    };
  }, [ownerId, owner, isOwner]);

  return state;
};
