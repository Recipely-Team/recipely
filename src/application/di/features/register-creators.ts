import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';
import { configureCreatorsStore } from '@application/creators/creators-store';
import { configureCreatorProfileStore } from '@application/creators/profile/creator-profile-store';
import { GetViewedUserProfileUseCase } from '@application/user-profile/get-viewed-user-profile-use-case';
import { ListUserRecipesUseCase } from '@application/user-profile/recipes/list-user-recipes-use-case';
import { FollowUserUseCase } from '@application/user-profile/follow/follow-user-use-case';
import { UnfollowUserUseCase } from '@application/user-profile/follow/unfollow-user-use-case';

/** **Creators composition** — the public creators strip and the viewed creator's profile. */
export const registerCreators = (
  container: Container,
): Pick<ApplicationStores, 'creatorsStore' | 'creatorProfileStore'> => {
  // Public, like the strip it feeds: not in `clearSessionCaches`.
  const userProfileRepo = container.resolve<UserProfileRepositoryInterface>(TOKENS.UserProfileRepository);
  const creatorsStore = configureCreatorsStore({
    listCreators: new ListCreatorsUseCase(userProfileRepo),
  });
  // Viewer-dependent (the follow standing), so it IS cleared on sign-out.
  const creatorProfileStore = configureCreatorProfileStore({
    getViewedProfile: new GetViewedUserProfileUseCase(userProfileRepo),
    listUserRecipes: new ListUserRecipesUseCase(userProfileRepo),
    follow: new FollowUserUseCase(userProfileRepo),
    unfollow: new UnfollowUserUseCase(userProfileRepo),
  });
  return { creatorsStore, creatorProfileStore };
};
