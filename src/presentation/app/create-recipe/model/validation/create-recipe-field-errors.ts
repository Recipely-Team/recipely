import type { CreateRecipeFieldKey } from '@presentation/app/create-recipe/model/validation/create-recipe-field-key';

/** Result of matching a `ValidationFailure.fieldErrors` breakdown onto this screen's inputs. */
export interface CreateRecipeFieldErrors {
  /** One message per matched field, keyed by the input it should highlight. */
  fields: Partial<Record<CreateRecipeFieldKey, string>>;
  /** Messages for entries that didn't match a known input here — never dropped, just not inline. */
  unmatched: string[];
}
