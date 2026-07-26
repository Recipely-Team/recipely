/**
 * Tags shown on a recipe card before the rest are dropped.
 *
 * Lives beside the card that enforces it rather than in a shared constants
 * bag: nothing else in the app has an opinion about how many tags fit on a
 * card, and a limit that only one component reads is not cross-cutting.
 */
export const RECIPE_CARD_TAG_LIMIT = 2;
