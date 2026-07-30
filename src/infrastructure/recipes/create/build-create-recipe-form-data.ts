import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import { appendFilePart } from '@infrastructure/network/upload/append-file-part';
import { ValueConstants } from '@core/constants';

/**
 * Builds the multipart `FormData` for `POST /recipes/with-media`.
 *
 * Every media file is appended under the `media` field in order: the backend
 * (Multer `.array('media', 10)`) promotes the first image to the cover `image`
 * and persists the rest as the gallery. A cover the backend already hosts —
 * the frame an Instagram import lifted out of the video — rides along as the
 * plain `image` field instead, because the device has no file to send for it.
 * Optional fields are omitted entirely when unset so the backend applies its
 * own defaults.
 */
export const buildCreateRecipeFormData = async (
  input: CreateRecipeInput,
): Promise<FormData> => {
  const formData = new FormData();
  for (const item of input.media) {
    await appendFilePart(formData, 'media', {
      uri: item.uri,
      fileName: item.fileName,
      mimeType: item.mimeType,
    });
  }

  // The cover the importer already stored, handed back as a field. The route
  // reads `req.body.image` only when no file was uploaded, so a photo the user
  // picked still wins — which is the precedence we want.
  if (input.imageUrl !== undefined) {
    formData.append('image', input.imageUrl);
  }

  formData.append('name', JSON.stringify(input.name));
  formData.append('cuisine', input.cuisine);
  formData.append('category', input.category);
  formData.append('difficulty', input.difficulty);
  formData.append('ingredients', JSON.stringify(input.ingredients));
  formData.append('instructions', JSON.stringify(input.instructions));
  formData.append('prepTimeMinutes', String(input.prepTimeMinutes));
  formData.append('cookTimeMinutes', String(input.cookTimeMinutes));
  formData.append('servings', String(input.servings));

  if (input.rating !== undefined) {
    formData.append('rating', String(input.rating));
  }
  if (input.tags) {
    formData.append('tags', JSON.stringify(input.tags));
  }
  if (input.mealType && Object.values(input.mealType).some((arr) => arr.length > ValueConstants.zero)) {
    formData.append('mealType', JSON.stringify(input.mealType));
  }
  if (input.isPublished !== undefined) {
    formData.append('isPublished', String(input.isPublished));
  }

  return formData;
};
