import type { StoreStatus } from '@application/store/store-status';

export interface MyRecipesListLoaded {
  status: typeof StoreStatus.Loaded;
}
