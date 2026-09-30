import type { LoggableFood } from '@domain/diary/entry/loggable-food';

/** Turns a listed recipe into a loggable serving, as `useRecipeFoodLoader` exposes it. */
export interface RecipeFoodLoader {
  /** The recipe row being fetched, for its spinner; null when idle. */
  loadingId: string | null;
  /** Fetches the recipe and builds its serving; null (after a toast) when it cannot be logged. */
  open: (recipeId: string) => Promise<LoggableFood | null>;
}
