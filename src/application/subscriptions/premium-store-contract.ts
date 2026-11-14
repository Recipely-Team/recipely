import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionProduct } from '@domain/subscriptions/subscription-product';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';

export interface PremiumStore {
  /** What the backend confirmed this session; `null` until a purchase or restore answers. User-scoped. */
  entitlement: PremiumEntitlement | null;
  /** The two premium plans with the store's price. The paywall keeps its own flow state. */
  loadPlans: () => Promise<Result<SubscriptionProduct[], Failure>>;
  /** Buys a plan; on success the entitlement is stored. */
  purchase: (productId: string) => Promise<Result<PremiumEntitlement, Failure>>;
  /** Restores from the store; `null` means nothing to restore. On success the entitlement is stored. */
  restore: () => Promise<Result<PremiumEntitlement | null, Failure>>;
  /** True once the backend has answered this session, so a screen asks at most once. */
  hasChecked: boolean;
  /** Asks the backend whether the account is premium; concurrent calls share one request. */
  refresh: () => Promise<void>;
  /** Forgets the entitlement (sign-out, account switch). */
  clear: () => void;
}
