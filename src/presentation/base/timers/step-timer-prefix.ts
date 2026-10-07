/**
 * What every step timer id of a recipe starts with, `${recipeId}:step`.
 *
 * The timers bar uses it to leave out the step timers cook mode already shows
 * inline while that recipe is being cooked.
 */
export const stepTimerPrefix = (recipeId: string): string => `${recipeId}:step`;
