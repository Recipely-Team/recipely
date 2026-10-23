import type { StoreStatus } from '@application/store/store-status';

export interface RecipeDetailLoading {
  status: typeof StoreStatus.Loading;
}
