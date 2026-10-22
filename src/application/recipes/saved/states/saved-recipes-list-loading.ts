import type { StoreStatus } from '@application/store/store-status';

export interface SavedRecipesListLoading {
  status: typeof StoreStatus.Loading;
}
