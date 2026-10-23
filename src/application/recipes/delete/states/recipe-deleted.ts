import type { StoreStatus } from '@application/store/store-status';

export interface RecipeDeleted {
  status: typeof StoreStatus.Success;
}
