import { ok } from '@core/result/result-helpers';
import { SignInWithAppleUseCase } from '@application/auth/sign-in/sign-in-with-apple-use-case';
import { SignInWithGoogleUseCase } from '@application/auth/sign-in/sign-in-with-google-use-case';
import { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import { DeleteCommentUseCase } from '@application/comments/delete/delete-comment-use-case';
import { ListCommentsUseCase } from '@application/comments/list/list-comments-use-case';
import { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';
import { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import { GetImportJobUseCase } from '@application/recipes/import/get-import-job-use-case';
import { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';
import { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';

/**
 * The use cases that are a single port call: each must reach the right
 * repository method with exactly the arguments it was given (or the fields of
 * its input) and hand back the repository's Result untouched — a swapped
 * argument or a dropped field is the one way such a class can be wrong.
 */
type Delegation = {
  readonly name: string;
  readonly build: (repo: never) => { execute: (...args: never[]) => Promise<unknown> };
  readonly method: string;
  readonly args: readonly unknown[];
  readonly forwarded: readonly unknown[];
};

const filters = { cuisines: ['ITALIAN'] };
const CASES: readonly Delegation[] = [
  { name: 'SignInWithApple', build: (r) => new SignInWithAppleUseCase(r), method: 'signInWithApple', args: [], forwarded: [] },
  { name: 'SignInWithGoogle', build: (r) => new SignInWithGoogleUseCase(r), method: 'signInWithGoogle', args: [], forwarded: [] },
  { name: 'AddComment', build: (r) => new AddCommentUseCase(r), method: 'add', args: [{ recipeId: 'r1', body: 'yum' }], forwarded: ['r1', 'yum'] },
  { name: 'DeleteComment', build: (r) => new DeleteCommentUseCase(r), method: 'remove', args: [{ recipeId: 'r1', commentId: 'c1' }], forwarded: ['r1', 'c1'] },
  { name: 'ListComments', build: (r) => new ListCommentsUseCase(r), method: 'listByRecipe', args: [{ recipeId: 'r1', page: 2, pageSize: 20 }], forwarded: ['r1', 2, 20] },
  { name: 'SearchProducts', build: (r) => new SearchProductsUseCase(r), method: 'searchProducts', args: ['oat', 3, 20], forwarded: ['oat', 3, 20] },
  { name: 'AddFavorite', build: (r) => new AddFavoriteUseCase(r), method: 'addFavorite', args: ['u1', 'r1'], forwarded: ['u1', 'r1'] },
  { name: 'LoadFavorites', build: (r) => new LoadFavoritesUseCase(r), method: 'listFavorites', args: [], forwarded: [] },
  { name: 'RemoveFavorite', build: (r) => new RemoveFavoriteUseCase(r), method: 'removeFavorite', args: ['u1', 'r1'], forwarded: ['u1', 'r1'] },
  { name: 'LikeRecipe', build: (r) => new LikeRecipeUseCase(r), method: 'like', args: ['r1'], forwarded: ['r1'] },
  { name: 'LoadLikedRecipes', build: (r) => new LoadLikedRecipesUseCase(r), method: 'listLiked', args: [], forwarded: [] },
  { name: 'UnlikeRecipe', build: (r) => new UnlikeRecipeUseCase(r), method: 'unlike', args: ['r1'], forwarded: ['r1'] },
  { name: 'RegisterDeviceToken', build: (r) => new RegisterDeviceTokenUseCase(r), method: 'registerDeviceToken', args: ['tok', 'android'], forwarded: ['tok', 'android'] },
  { name: 'ListNotifications', build: (r) => new ListNotificationsUseCase(r), method: 'list', args: [{ limit: 20, offset: 40 }], forwarded: [20, 40] },
  { name: 'MarkAllRead', build: (r) => new MarkAllReadUseCase(r), method: 'markAllRead', args: [], forwarded: [] },
  { name: 'MarkOneRead', build: (r) => new MarkOneReadUseCase(r), method: 'markOneRead', args: ['n1'], forwarded: ['n1'] },
  { name: 'DeleteRecipe', build: (r) => new DeleteRecipeUseCase(r), method: 'deleteRecipe', args: ['r1'], forwarded: ['r1'] },
  { name: 'GetImportJob', build: (r) => new GetImportJobUseCase(r), method: 'getImportJob', args: ['j1'], forwarded: ['j1'] },
  { name: 'ListRecipes', build: (r) => new ListRecipesUseCase(r), method: 'listActiveRecipes', args: [filters], forwarded: [filters] },
  { name: 'ListMyRecipes', build: (r) => new ListMyRecipesUseCase(r), method: 'listMyRecipes', args: [], forwarded: [] },
  { name: 'AddRecipePhoto', build: (r) => new AddRecipePhotoUseCase(r), method: 'addRecipePhoto', args: ['r1', 'file:///a.jpg', 'a.jpg', 'image/jpeg'], forwarded: ['r1', 'file:///a.jpg', 'a.jpg', 'image/jpeg'] },
  { name: 'RemoveRecipeCover', build: (r) => new RemoveRecipeCoverUseCase(r), method: 'removeRecipeCover', args: ['r1'], forwarded: ['r1'] },
  { name: 'RemoveRecipePhoto', build: (r) => new RemoveRecipePhotoUseCase(r), method: 'removeRecipePhoto', args: ['r1', 'm1'], forwarded: ['r1', 'm1'] },
];

describe('single-call use cases', () => {
  it.each(CASES)('$name forwards its arguments and returns the port result untouched', async (c) => {
    const answer = ok({ from: c.method });
    const port = jest.fn().mockResolvedValue(answer);
    const useCase = c.build({ [c.method]: port } as never);
    await expect(useCase.execute(...(c.args as never[]))).resolves.toBe(answer);
    expect(port).toHaveBeenCalledTimes(1);
    expect(port).toHaveBeenCalledWith(...c.forwarded);
  });
});
