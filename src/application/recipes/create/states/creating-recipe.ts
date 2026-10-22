import type { StoreStatus } from '@application/store/store-status';

export interface CreatingRecipe {
  status: typeof StoreStatus.Creating;
}
