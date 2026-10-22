import type { StoreStatus } from '@application/store/store-status';

export interface RefineRecipeIdle {
  status: typeof StoreStatus.Idle;
}
