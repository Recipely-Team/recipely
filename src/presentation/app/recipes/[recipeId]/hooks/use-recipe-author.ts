import { useEffect, useState } from 'react';
import { container } from '@core/di/container-instance';
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
  const [state, setState] = useState<RecipeAuthorState>({ status: 'loading' });

  useEffect(() => {
    if (owner !== null) {
      setState({ status: 'resolved', author: owner });
      return;
    }
    // Owned recipe whose own profile has not resolved yet: hold on loading
    // instead of fetching — the signed-in user's profile is the caller's job.
    if (isOwner) {
      setState({ status: 'loading' });
      return;
    }
    if (ownerId === null || ownerId.length === ValueConstants.zero) {
      setState({ status: 'unavailable' });
      return;
    }

    let active = true;
    setState({ status: 'loading' });
    const useCase = container.resolve<GetUserProfileUseCase>(
      TOKENS.GetUserProfileUseCase,
    );
    void useCase.execute({ userId: ownerId }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setState({ status: 'unavailable' });
        return;
      }
      setState({
        status: 'resolved',
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
