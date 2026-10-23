import type { StoreStatus } from '@application/store/store-status';

export interface RecipeListIdle {
  status: typeof StoreStatus.Idle;
}
