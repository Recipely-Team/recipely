/**
 * Width thresholds used across the app to decide which layout adapts to the
 * viewport. Mobile-first; everything below `tablet` renders the mobile shell.
 * Above `desktop` we render the web shell (sticky header + grids + caps).
 */
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 900,
  wide: 1200,
} as const;

/**
 * Per-route content max-width caps on an expanded viewport. Mobile-first
 * screens (profile, createRecipe, settings, etc.) need a container or their
 * full-width controls span the whole desktop viewport.
 *
 * Browsing grids are capped far wider than reading surfaces on purpose. A cap
 * is a readability constraint — a 2000px line of instructions is unreadable,
 * which is why `recipeDetail` and the forms stay narrow. A grid of cards has no
 * line length to protect, so the same 1200 there just froze the feed at three
 * columns from a 1200px window all the way to a 4K one, wasting every pixel
 * past the cap.
 */
export const WEB_CONTENT_MAX_WIDTH = {
  default: 1200,
  recipes: 1800,
  myRecipes: 1800,
  profile: 720,
  createRecipe: 760,
  aiGenerate: 760,
  importRecipe: 560,
  recipeDetail: 980,
  notifications: 720,
  settings: 720,
  forms: 480,
} as const;
