import type { ValidationFieldError } from '@core/failure';
import type { CreateRecipeFieldKey } from '@presentation/app/create-recipe/model/validation/create-recipe-field-key';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import { ValueConstants } from '@core/constants';

const KNOWN_FIELDS: ReadonlySet<string> = new Set<CreateRecipeFieldKey>([
  'name',
  'cuisine',
  'category',
  'difficulty',
  'prepTimeMinutes',
  'cookTimeMinutes',
  'servings',
  'ingredients',
  'instructions',
]);

const isKnownField = (value: string): value is CreateRecipeFieldKey => KNOWN_FIELDS.has(value);

export const NO_CREATE_RECIPE_FIELD_ERRORS: CreateRecipeFieldErrors = { fields: {}, unmatched: [] };

/**
 * Maps a `ValidationFailure.fieldErrors` breakdown onto this screen's known
 * inputs, so each can render a red border + inline message instead of a
 * lone "check the highlighted fields" toast with nothing actually highlighted.
 *
 * The backend's Zod path is field-first but may carry extra segments (e.g.
 * `name.en`, `ingredients.en.0`) for localized/array sub-fields — only the
 * leading segment is used to match, since this screen highlights whole
 * fields, not individual array items or locale keys. An entry with no
 * `field`, or a `field` this screen doesn't render (e.g. `image`, `tags`),
 * lands in `unmatched` so the caller can still surface it (e.g. appended to
 * the toast) instead of silently dropping it. When the same field appears
 * more than once, the first message wins.
 */
export const mapFieldErrorsToInputs = (
  fieldErrors: readonly ValidationFieldError[],
): CreateRecipeFieldErrors => {
  const fields: Partial<Record<CreateRecipeFieldKey, string>> = {};
  const unmatched: string[] = [];
  for (const entry of fieldErrors) {
    const base = entry.field?.split('.')[ValueConstants.zero];
    if (base !== undefined && isKnownField(base)) {
      if (fields[base] === undefined) fields[base] = entry.message;
      continue;
    }
    unmatched.push(entry.field !== undefined ? `${entry.field}: ${entry.message}` : entry.message);
  }
  return { fields, unmatched };
};
