import type { StoreStatus } from '@application/store/store-status';

export interface RecipeDetailIdle {
  status: typeof StoreStatus.Idle;
}
