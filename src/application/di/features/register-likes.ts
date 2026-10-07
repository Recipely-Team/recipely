import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import type { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import { configureLikesStore } from '@application/likes/likes-store';
import type { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { configureLikedRecipesStore } from '@application/recipes/liked/liked-recipes-store';

/** **Likes composition** — the recipe like toggle and the liked-recipes list it keeps in step. */
export const registerLikes = (
  container: Container,
): Pick<ApplicationStores, 'likedRecipesStore' | 'likesStore'> => {
  const likeRecipeUseCase = container.resolve<LikeRecipeUseCase>(TOKENS.LikeRecipeUseCase);
  const unlikeRecipeUseCase = container.resolve<UnlikeRecipeUseCase>(TOKENS.UnlikeRecipeUseCase);
  const loadLikedRecipesUseCase = container.resolve<LoadLikedRecipesUseCase>(TOKENS.LoadLikedRecipesUseCase);

  const likedRecipesStore = configureLikedRecipesStore({ loadLikedRecipesUseCase });
  const likesStore = configureLikesStore({
    likeRecipe: likeRecipeUseCase,
    unlikeRecipe: unlikeRecipeUseCase,
    likedRecipesStore,
  });
  return { likedRecipesStore, likesStore };
};
