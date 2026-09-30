import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/** A list recipe for a diary assistant test; `caloriesPerServing` 0 means "cannot be logged". */
export const recipeSummaryOf = (id: string, name: string, caloriesPerServing = 350): RecipeSummaryEntity => {
  const created = RecipeSummaryEntity.create({
    id, name, image: '', cuisine: '', category: '', difficulty: Difficulty.Easy, totalTimeMinutes: null, rating: 0,
    isPublished: true, moderationStatus: 'approved', likeCount: 0, likedByMe: false, commentCount: 0, viewCount: 0,
    origin: RecipeOrigin.User, sourcePlatform: null, aiWritten: false, photoCount: 0, caloriesPerServing,
  });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};
