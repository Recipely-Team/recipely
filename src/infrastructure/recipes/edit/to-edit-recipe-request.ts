import type { RequestMapper } from '@core/mapper/request-mapper';
import type { EditRecipeInput } from '@domain/recipes/edit/edit-recipe-input';
import type { EditRecipeRequestDto } from '@infrastructure/recipes/edit/edit-recipe-request-dto';

/**
 * Builds the PATCH body from an edit. Field for field — `exactOptionalPropertyTypes`
 * keeps an untouched field absent, and an absent key is what "unchanged" means.
 */
export const toEditRecipeRequest: RequestMapper<EditRecipeInput, EditRecipeRequestDto> = (input) => ({
  ...input,
});
