import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/**
 * Converts a full-detail `Recipe` into a lean `RecipeSummaryEntity`, so an
 * owner-mutation flow (e.g. after a create) can patch a
 * `RecipeSummaryEntity[]` list cache in place without a network round-trip.
 * `totalTimeMinutes` is derived by summing `prepTimeMinutes` +
 * `cookTimeMinutes`, since detail flows only carry those two fields.
 */
export const recipeToSummary = (recipe: RecipeEntity): Result<RecipeSummaryEntity, ValidationFailure> => {
  return RecipeSummaryEntity.create({
    id: recipe.id,
    name: recipe.name,
    image: recipe.image,
    cuisine: recipe.cuisine,
    category: recipe.category,
    difficulty: recipe.difficulty,
    totalTimeMinutes: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
    rating: recipe.rating,
    isPublished: recipe.isPublished,
    moderationStatus: recipe.moderationStatus,
    likeCount: recipe.likeCount,
    likedByMe: recipe.likedByMe,
    commentCount: recipe.commentCount,
    viewCount: recipe.viewCount,
    // Carried, not defaulted. This is the path a just-published recipe takes
    // into the feed cache without a round-trip, so dropping it here would make
    // the badge appear only after a refresh — present on the server, absent on
    // the one screen that just created it.
    origin: recipe.origin,
    sourcePlatform: recipe.sourcePlatform,
    aiWritten: recipe.aiWritten,
  });
};
