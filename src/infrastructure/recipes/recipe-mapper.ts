import type { ValidationFailure } from '@core/failure';
import type { Mapper } from '@core/mapper/mapper';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';
import { ValueConstants } from '@core/constants';

/**
 * Maps a `RecipeDto` from the API into a domain `Recipe` entity. When the
 * backend sends a `media[]` array it is used directly; otherwise the cover
 * `image` is promoted into a single-item gallery — but only when it is a real
 * (non-empty) URL. AI generate/refine previews ship `image: ''`, and promoting
 * that into a `[{ url: '' }]` item would defeat the create flow's add-photo
 * guard, so an empty cover maps to an empty gallery instead.
 */
export const toRecipe: Mapper<RecipeDto, RecipeEntity, ValidationFailure> = (dto) => {
  const media: MediaItem[] =
    dto.media && dto.media.length > ValueConstants.zero
      ? dto.media.map((m) => ({ type: m.type, url: m.url }))
      : dto.image.trim().length > ValueConstants.zero
        ? [{ type: 'image', url: dto.image }]
        : [];

  return RecipeEntity.create({
    id: dto.id,
    name: dto.name,
    cuisine: dto.cuisine,
    category: dto.category,
    difficulty: dto.difficulty,
    ingredients: dto.ingredients,
    instructions: dto.instructions,
    prepTimeMinutes: dto.prepTimeMinutes,
    cookTimeMinutes: dto.cookTimeMinutes,
    servings: dto.servings ?? 1,
    caloriesPerServing: dto.caloriesPerServing ?? ValueConstants.zero,
    nutrition: dto.nutrition,
    image: dto.image,
    media,
    rating: dto.rating,
    tags: dto.tags,
    mealType: dto.mealType,
    ownerId: dto.ownerId,
    likeCount: dto.likeCount ?? ValueConstants.zero,
    likedByMe: dto.likedByMe ?? false,
    viewCount: dto.viewCount ?? ValueConstants.zero,
    moderationStatus: dto.moderationStatus,
    commentCount: dto.commentCount ?? ValueConstants.zero,
  });
};

/**
 * Maps a lean `RecipeListItemDto` (list/my-recipes/trending endpoints) into a
 * domain `RecipeSummaryEntity` entity.
 */
export const toRecipeSummary: Mapper<RecipeListItemDto, RecipeSummaryEntity, ValidationFailure> = (
  dto,
) => {
  return RecipeSummaryEntity.create({
    id: dto.id,
    name: dto.name,
    image: dto.image,
    cuisine: dto.cuisine,
    category: dto.category,
    difficulty: dto.difficulty,
    totalTimeMinutes: dto.totalTimeMinutes,
    rating: dto.rating,
    moderationStatus: dto.moderationStatus,
    likeCount: dto.likeCount ?? ValueConstants.zero,
    likedByMe: dto.likedByMe ?? false,
    commentCount: dto.commentCount ?? ValueConstants.zero,
    viewCount: dto.viewCount ?? ValueConstants.zero,
  });
};
