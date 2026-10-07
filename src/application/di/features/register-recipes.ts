import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';
import { ListRecipesUseCase } from '@application/recipes/list/list-recipes-use-case';
import { ListTrendingRecipesUseCase } from '@application/recipes/trending/list-trending-recipes-use-case';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import { EnqueueInstagramImportUseCase } from '@application/recipes/import/enqueue-instagram-import-use-case';
import { ImportRecipeFromFilesUseCase } from '@application/recipes/import-file/import-recipe-from-files-use-case';
import { configureFileImportStore } from '@application/recipes/import-file/file-import-store';
import { GetImportJobUseCase } from '@application/recipes/import/get-import-job-use-case';
import { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import { configureImportJobStore } from '@application/recipes/import/import-job-store';
import { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';
import { configureRecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store';
import type { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import type { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { configureRecipeListStore } from '@application/recipes/list/recipe-list-store';
import { configureTrendingRecipesStore } from '@application/recipes/trending/trending-recipes-store';
import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { configureSavedRecipesStore } from '@application/recipes/saved/saved-recipes-store';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import { configureFavoritesStore } from '@application/favorites/favorites-store';

/**
 * **Recipes composition** — the feed, detail, publishing, my-recipes, import and favourites
 * stores, built from the recipe repository and the favourite use cases.
 *
 * @remarks
 * - **Order:** `recipeListStore` and `recipeDetailStore` are built before the stores that
 *   refresh them (`recipePublishingStore`, `createdRecipesStore`).
 */
export const registerRecipes = (
  container: Container,
): Pick<
  ApplicationStores,
  | 'recipeListStore'
  | 'trendingRecipesStore'
  | 'recipeDetailStore'
  | 'recipePublishingStore'
  | 'savedRecipesStore'
  | 'createdRecipesStore'
  | 'importJobStore'
  | 'fileImportStore'
  | 'favoritesStore'
  | 'loadFavoritesUseCase'
> => {
  const recipeRepo = container.resolve<RecipeRepositoryInterface>(TOKENS.RecipeRepository);
  const listRecipes = new ListRecipesUseCase(recipeRepo);
  const listTrendingRecipes = new ListTrendingRecipesUseCase(recipeRepo);
  const getRecipe = new GetRecipeUseCase(recipeRepo);
  const createRecipeUseCase = new CreateRecipeUseCase(recipeRepo);
  const listMyRecipesUseCase = new ListMyRecipesUseCase(recipeRepo);
  const generateRecipeUseCase = new GenerateRecipeUseCase(recipeRepo);
  const importInstagramRecipeUseCase = new ImportInstagramRecipeUseCase(recipeRepo);
  const enqueueInstagramImportUseCase = new EnqueueInstagramImportUseCase(recipeRepo);
  const getImportJobUseCase = new GetImportJobUseCase(recipeRepo);
  const refineRecipeUseCase = new RefineRecipeUseCase(recipeRepo);
  const deleteRecipeUseCase = new DeleteRecipeUseCase(recipeRepo);

  const addFavoriteUseCase = container.resolve<AddFavoriteUseCase>(TOKENS.AddFavoriteUseCase);
  const removeFavoriteUseCase = container.resolve<RemoveFavoriteUseCase>(TOKENS.RemoveFavoriteUseCase);
  const loadFavoritesUseCase = container.resolve<LoadFavoritesUseCase>(TOKENS.LoadFavoritesUseCase);

  const savedRecipesStore = configureSavedRecipesStore({ loadFavoritesUseCase });
  const recipeListStore = configureRecipeListStore({ listRecipes });
  const trendingRecipesStore = configureTrendingRecipesStore({ listTrendingRecipes });
  const addRecipePhotoUseCase = new AddRecipePhotoUseCase(recipeRepo);
  const removeRecipePhotoUseCase = new RemoveRecipePhotoUseCase(recipeRepo);
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe,
    addRecipePhoto: addRecipePhotoUseCase,
    removeRecipePhoto: removeRecipePhotoUseCase,
    removeRecipeCover: new RemoveRecipeCoverUseCase(recipeRepo),
  });
  const recipePublishingStore = configureRecipePublishingStore({
    publishRecipe: new PublishRecipeUseCase(recipeRepo),
    unpublishRecipe: new UnpublishRecipeUseCase(recipeRepo),
    editRecipe: new EditRecipeUseCase(recipeRepo),
    recipeDetailStore,
  });
  const favoritesStore = configureFavoritesStore({
    addFavoriteUseCase,
    removeFavoriteUseCase,
    savedRecipesStore,
  });
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase,
    listMyRecipesUseCase,
    generateRecipeUseCase,
    importInstagramRecipeUseCase,
    refineRecipeUseCase,
    deleteRecipeUseCase,
    recipeListStore,
    recipeDetailStore,
  });
  const importJobStore = configureImportJobStore({
    enqueueInstagramImportUseCase,
    getImportJobUseCase,
  });
  const fileImportStore = configureFileImportStore({
    importRecipeFromFilesUseCase: new ImportRecipeFromFilesUseCase(recipeRepo),
  });
  return {
    recipeListStore,
    trendingRecipesStore,
    recipeDetailStore,
    recipePublishingStore,
    savedRecipesStore,
    createdRecipesStore,
    importJobStore,
    fileImportStore,
    favoritesStore,
    loadFavoritesUseCase,
  };
};
