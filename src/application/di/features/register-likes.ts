import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { LikeRepositoryInterface } from '@domain/likes/like-repository-interface';
import { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import { configureLikesStore } from '@application/likes/likes-store';
import { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { configureLikedRecipesStore } from '@application/recipes/liked/liked-recipes-store';

/** **Likes composition** — the recipe like toggle and the liked-recipes list it keeps in step. */
export const registerLikes = (
  container: Container,
): Pick<ApplicationStores, 'likedRecipesStore' | 'likesStore'> => {
  const likeRepo = container.resolve<LikeRepositoryInterface>(TOKENS.LikeRepository);

  const likedRecipesStore = configureLikedRecipesStore({
    loadLikedRecipesUseCase: new LoadLikedRecipesUseCase(likeRepo),
  });
  const likesStore = configureLikesStore({
    likeRecipe: new LikeRecipeUseCase(likeRepo),
    unlikeRecipe: new UnlikeRecipeUseCase(likeRepo),
    likedRecipesStore,
  });
  return { likedRecipesStore, likesStore };
};
