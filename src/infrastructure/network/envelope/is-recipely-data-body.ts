import type { RecipelyDataBody } from '@infrastructure/network/envelope/recipely-data-body';
import { hasKey } from '@core/guards/type-guards';

/** Narrows a decrypted response body to the Recipely `{ data: T }` envelope. */
export const isRecipelyDataBody = <T>(body: unknown): body is RecipelyDataBody<T> =>
  hasKey(body, 'data');
