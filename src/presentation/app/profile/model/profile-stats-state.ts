import type { StoreStatus } from '@application/store/store-status';
/**
 * Discriminated union describing the profile stats row: still loading, failed
 * (with a retry handler), loaded (carrying the raw counts the row formats), or
 * idle (nothing to show yet).
 */
export type ProfileStatsState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Error; message: string; onRetry: () => void }
  | {
      status: typeof StoreStatus.Loaded;
      recipeCount: number;
      totalLikes: number;
      totalViews: number;
      savedCount: number;
    };
