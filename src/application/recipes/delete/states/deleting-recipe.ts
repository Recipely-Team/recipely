import type { StoreStatus } from '@application/store/store-status';

export interface DeletingRecipe {
  status: typeof StoreStatus.Deleting;
}
