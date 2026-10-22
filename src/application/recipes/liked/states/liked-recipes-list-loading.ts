import type { StoreStatus } from '@application/store/store-status';

export interface LikedRecipesListLoading {
  status: typeof StoreStatus.Loading;
}
