import type { StoreStatus } from '@application/store/store-status';

export interface LikedRecipesListIdle {
  status: typeof StoreStatus.Idle;
}
