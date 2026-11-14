import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionPurchase } from '@domain/subscriptions/subscription-purchase';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';

/**
 * Port to the backend that verifies a store purchase and grants premium.
 *
 * @remarks
 * - **The store is the source of truth.** The backend asks Apple or Google about the
 *   purchase and answers with the entitlement it stored.
 */
export interface SubscriptionVerifierInterface {
  verify(purchase: SubscriptionPurchase): Promise<Result<PremiumEntitlement, Failure>>;
  /** Whether the signed-in account is premium right now, as the backend has it. */
  status(): Promise<Result<PremiumEntitlement, Failure>>;
}
