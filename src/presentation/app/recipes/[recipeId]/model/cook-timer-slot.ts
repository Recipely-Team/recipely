/**
 * The id of a recipe's cook-time countdown, built the same way everywhere.
 *
 * The timer store is keyed by this string, so the meta card that shows the
 * countdown and the assistant action that starts it have to agree character
 * for character — two spellings would silently be two different timers, one
 * of them invisible.
 */
export const cookTimerId = (recipeId: string): string => `${recipeId}:cook`;
