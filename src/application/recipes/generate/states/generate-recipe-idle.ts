import type { StoreStatus } from '@application/store/store-status';

export interface GenerateRecipeIdle {
  status: typeof StoreStatus.Idle;
}
