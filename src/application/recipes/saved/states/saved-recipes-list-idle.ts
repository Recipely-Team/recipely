import type { StoreStatus } from '@application/store/store-status';

export interface SavedRecipesListIdle {
  status: typeof StoreStatus.Idle;
}
