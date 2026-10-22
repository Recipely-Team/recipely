import type { StoreStatus } from '@application/store/store-status';

export interface RecipeListLoading {
  status: typeof StoreStatus.Loading;
}
