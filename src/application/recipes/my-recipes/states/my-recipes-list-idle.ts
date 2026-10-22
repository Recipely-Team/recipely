import type { StoreStatus } from '@application/store/store-status';

export interface MyRecipesListIdle {
  status: typeof StoreStatus.Idle;
}
