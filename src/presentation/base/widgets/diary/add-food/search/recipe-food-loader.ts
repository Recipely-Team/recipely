import type { LoggableFood } from '@domain/diary/entry/loggable-food';

/** Turns a listed recipe into a loggable serving, as `useRecipeFoodLoader` exposes it. */
export interface RecipeFoodLoader {
  /** The recipe row being fetched, for its spinner; null when idle. */
  loadingId: string | null;
  /** Kcal per serving when the recipe is already cached with calories, else null (the row then omits it). */
  caloriesFor: (recipeId: string) => number | null;
  /** Fetches the recipe and builds its serving; null (after a toast) when it cannot be logged. */
  open: (recipeId: string) => Promise<LoggableFood | null>;
}
