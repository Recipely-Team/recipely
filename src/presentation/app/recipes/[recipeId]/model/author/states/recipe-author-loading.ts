import type { StoreStatus } from '@application/store/store-status';

export interface RecipeAuthorLoading {
  status: typeof StoreStatus.Loading;
}
