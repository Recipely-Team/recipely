import { configureStepProgressStore } from '@application/recipes/cooking/step-progress-store';
import { configurePortionChoiceStore } from '@application/recipes/cooking/portion-choice-store';
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
import { RemoveRecipeMediaUseCase } from '@application/recipes/photos/remove-recipe-media-use-case';
import { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';
import { configureRecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store';
import type { FavoritesRepositoryInterface } from '@domain/favorites/favorites-repository-interface';
import { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
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
  | 'stepProgressStore'
  | 'portionChoiceStore'
> => {
  const recipeRepo = container.resolve<RecipeRepositoryInterface>(TOKENS.RecipeRepository);
  const favoritesRepo = container.resolve<FavoritesRepositoryInterface>(TOKENS.FavoritesRepository);
  // Shared: the saved list loads with it and the auth store reloads it on sign-in.
  const loadFavoritesUseCase = new LoadFavoritesUseCase(favoritesRepo);

  const recipeListStore = configureRecipeListStore({ listRecipes: new ListRecipesUseCase(recipeRepo) });
  const trendingRecipesStore = configureTrendingRecipesStore({
    listTrendingRecipes: new ListTrendingRecipesUseCase(recipeRepo),
  });
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe: new GetRecipeUseCase(recipeRepo),
    addRecipePhoto: new AddRecipePhotoUseCase(recipeRepo),
    removeRecipeMedia: new RemoveRecipeMediaUseCase(
      new RemoveRecipePhotoUseCase(recipeRepo),
      new RemoveRecipeCoverUseCase(recipeRepo),
    ),
  });
  const recipePublishingStore = configureRecipePublishingStore({
    publishRecipe: new PublishRecipeUseCase(recipeRepo),
    unpublishRecipe: new UnpublishRecipeUseCase(recipeRepo),
    editRecipe: new EditRecipeUseCase(recipeRepo),
    recipeDetailStore,
  });
  const savedRecipesStore = configureSavedRecipesStore({ loadFavoritesUseCase });
  const favoritesStore = configureFavoritesStore({
    addFavoriteUseCase: new AddFavoriteUseCase(favoritesRepo),
    removeFavoriteUseCase: new RemoveFavoriteUseCase(favoritesRepo),
    savedRecipesStore,
  });
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase: new CreateRecipeUseCase(recipeRepo),
    listMyRecipesUseCase: new ListMyRecipesUseCase(recipeRepo),
    generateRecipeUseCase: new GenerateRecipeUseCase(recipeRepo),
    importInstagramRecipeUseCase: new ImportInstagramRecipeUseCase(recipeRepo),
    refineRecipeUseCase: new RefineRecipeUseCase(recipeRepo),
    deleteRecipeUseCase: new DeleteRecipeUseCase(recipeRepo),
    recipeListStore,
    recipeDetailStore,
  });
  const importJobStore = configureImportJobStore({
    enqueueInstagramImportUseCase: new EnqueueInstagramImportUseCase(recipeRepo),
    getImportJobUseCase: new GetImportJobUseCase(recipeRepo),
  });
  const fileImportStore = configureFileImportStore({
    importRecipeFromFilesUseCase: new ImportRecipeFromFilesUseCase(recipeRepo),
  });
  const stepProgressStore = configureStepProgressStore();
  const portionChoiceStore = configurePortionChoiceStore();
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
    stepProgressStore,
    portionChoiceStore,
  };
};
