import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { isHostedMedia } from '@presentation/app/create-recipe/model/saving/is-hosted-media';
import { toMediaUpload } from '@presentation/app/create-recipe/model/saving/to-media-upload';
import { DIFFICULTY_LABELS } from '@presentation/app/create-recipe/model/taxonomy/difficulty-tag-labels';
import { ValueConstants } from '@core/constants';

const cleanLines = (lines: readonly string[]): string[] =>
  lines.map((s) => s.trim()).filter((s) => s.length > ValueConstants.zero);

/** Builds the create-recipe API payload from the editor state for a given locale. */
export const buildCreateInput = (recipe: EditableRecipe, locale: string): CreateRecipeInput => {
  const images = recipe.media.filter((m) => m.type === 'image');
  // An Instagram import arrives with a cover the backend already stored, so it
  // is a URL to hand back rather than a file to upload — see `isHostedMedia`.
  const uploads = images.filter((m) => !isHostedMedia(m));
  const hosted = images.find(isHostedMedia);
  return {
    name: { [locale]: recipe.name.trim() },
    cuisine: recipe.cuisine ?? CuisineKey.Other,
    category: recipe.category,
    difficulty: recipe.difficulty,
    ingredients: { [locale]: cleanLines(recipe.ingredients) },
    instructions: { [locale]: cleanLines(recipe.instructions) },
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    media: uploads.map(toMediaUpload),
    ...(hosted !== undefined ? { imageUrl: hosted.url } : {}),
    tags: { [locale]: [DIFFICULTY_LABELS[recipe.difficulty]] },
    mealType: { [locale]: [] },
    isPublished: true,
    locale,
  };
};
