import type { StoreStatus } from '@application/store/store-status';

export interface GeneratingRecipe {
  status: typeof StoreStatus.Generating;
}
