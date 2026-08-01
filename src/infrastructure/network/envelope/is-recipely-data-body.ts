import type { RecipelyDataBody } from '@infrastructure/network/envelope/recipely-data-body';

/** Narrows a decrypted response body to the Recipely `{ data: T }` envelope. */
export const isRecipelyDataBody = <T>(body: unknown): body is RecipelyDataBody<T> => {
  return typeof body === 'object' && body !== null && 'data' in body; // TO DO: static type check problem
};
