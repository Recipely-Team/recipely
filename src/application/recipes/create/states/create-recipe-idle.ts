import type { StoreStatus } from '@application/store/store-status';

export interface CreateRecipeIdle {
  status: typeof StoreStatus.Idle;
}
