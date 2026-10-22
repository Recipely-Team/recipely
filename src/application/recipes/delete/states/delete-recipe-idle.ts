import type { StoreStatus } from '@application/store/store-status';

export interface DeleteRecipeIdle {
  status: typeof StoreStatus.Idle;
}
