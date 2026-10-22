import type { StoreStatus } from '@application/store/store-status';

export interface LikedRecipesListLoaded {
  status: typeof StoreStatus.Loaded;
}
