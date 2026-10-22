import type { StoreStatus } from '@application/store/store-status';

export interface MyRecipesListLoading {
  status: typeof StoreStatus.Loading;
}
