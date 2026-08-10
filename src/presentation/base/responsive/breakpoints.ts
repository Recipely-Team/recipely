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
 * Per-route content max-width caps when the web shell is active. Mobile-first
 * screens (profile, createRecipe, settings, etc.) need a container or their
 * full-width controls span the whole desktop viewport.
 */
export const WEB_CONTENT_MAX_WIDTH = {
  default: 1200,
  recipes: 1200,
  myRecipes: 1200,
  profile: 720,
  createRecipe: 760,
  aiGenerate: 760,
  importRecipe: 560,
  recipeDetail: 980,
  notifications: 720,
  settings: 720,
  forms: 480,
} as const;
