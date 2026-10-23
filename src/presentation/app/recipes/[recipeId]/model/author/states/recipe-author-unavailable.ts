import type { StoreStatus } from '@application/store/store-status';

export interface RecipeAuthorUnavailable {
  status: typeof StoreStatus.Unavailable;
}
