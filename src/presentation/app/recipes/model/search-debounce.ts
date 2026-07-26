/**
 * Idle time (ms) after the last keystroke before the recipe search is sent to
 * the backend.
 *
 * Recipe search is server-side (`RecipeFilters.search`), so every change would
 * otherwise be a request. 350ms is the usual search-as-you-type window: long
 * enough that a normal typing burst collapses into a single call, short enough
 * that the pause before reading the results doesn't feel like a stall.
 */
export const SEARCH_DEBOUNCE_MS = 350;
