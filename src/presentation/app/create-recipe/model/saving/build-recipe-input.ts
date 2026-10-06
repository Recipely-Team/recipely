import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { isHostedMedia } from '@presentation/app/create-recipe/model/saving/is-hosted-media';
import { toMediaUpload } from '@presentation/app/create-recipe/model/saving/to-media-upload';
import { MediaType } from '@domain/recipes/media/media-type';
import { RecipeVisibility } from '@domain/recipes/publishing/recipe-visibility';

import { cleanLines } from '@presentation/app/create-recipe/model/saving/clean-lines';
import { cleanIngredients } from '@presentation/app/create-recipe/model/saving/clean-ingredients';

/** Builds the create-recipe API payload from the editor state for a given locale. */
export const buildCreateInput = (
  recipe: EditableRecipe,
  locale: string,
  fromDraftId?: string,
): CreateRecipeInput => {
  const images = recipe.media.filter((m) => m.type === MediaType.Image);
  // An imported cover is already hosted: hand back the URL (isHostedMedia).
  const uploads = images.filter((m) => !isHostedMedia(m));
  const hosted = images.find(isHostedMedia);
  return {
    name: { [locale]: recipe.name.trim() },
    cuisine: recipe.cuisine ?? CuisineKey.Other,
    category: recipe.category,
    difficulty: recipe.difficulty,
    ingredients: { [locale]: cleanIngredients(recipe.ingredients) },
    instructions: { [locale]: cleanLines(recipe.instructions) },
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    media: uploads.map(toMediaUpload),
    ...(hosted !== undefined ? { imageUrl: hosted.url } : {}),
    mealType: { [locale]: [] },
    // Every save is private; publishing is a separate, deliberate step.
    visibility: RecipeVisibility.Private,
    locale,
    // Names the draft so the server retires it and repoints its notifications.
    ...(fromDraftId !== undefined ? { fromDraftId } : {}),
  };
};
