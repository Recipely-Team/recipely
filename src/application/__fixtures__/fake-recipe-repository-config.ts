import type { MediaItem } from "@domain/recipes/media/media-item";
import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { ImportJob } from '@domain/recipes/import/import-job';
import type { RefinedRecipe } from '@domain/recipes/refine/refined-recipe';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { RecipePage } from '@domain/recipes/list/recipe-page';
import type { FileImportReceipt } from '@domain/recipes/import-file/file-import-receipt';
import type { PublishOutcome } from '@domain/recipes/publishing/publish-outcome';
import type { CoverRemoval } from '@domain/recipes/publishing/cover-removal';

export interface FakeRecipeRepositoryConfig {
  listActiveRecipesResult?: Result<RecipePage, Failure>;
  listTrendingRecipesResult?: Result<RecipeSummaryEntity[], Failure>;
  listMyRecipesResult?: Result<RecipePage, Failure>;
  getRecipeResult?: Result<RecipeEntity, Failure>;
  createRecipeResult?: Result<RecipeEntity, Failure>;
  generateRecipeResult?: Result<RecipeEntity, Failure>;
  importInstagramRecipeResult?: Result<RecipeEntity, Failure>;
  enqueueInstagramImportResult?: Result<ImportJob, Failure>;
  getImportJobResult?: Result<ImportJob, Failure>;
  refineRecipeResult?: Result<RefinedRecipe, Failure>;
  deleteRecipeResult?: Result<void, Failure>;
  addRecipePhotoResult?: Result<MediaItem, Failure>;
  removeRecipePhotoResult?: Result<void, Failure>;
  importRecipeFromFilesResult?: Result<FileImportReceipt, Failure>;
  removeRecipeCoverResult?: Result<CoverRemoval, Failure>;
  updateRecipeResult?: Result<RecipeEntity, Failure>;
  publishRecipeResult?: Result<PublishOutcome, Failure>;
  unpublishRecipeResult?: Result<PublishOutcome, Failure>;
}
