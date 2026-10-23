import type { StoreStatus } from '@application/store/store-status';

export interface ProfileStatsLoaded {
  status: typeof StoreStatus.Loaded;
  recipeCount: number;
  totalLikes: number;
  totalViews: number;
  savedCount: number;
}
