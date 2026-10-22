import type { StoreStatus } from '@application/store/store-status';

export interface SavedRecipesListLoaded {
  status: typeof StoreStatus.Loaded;
}
