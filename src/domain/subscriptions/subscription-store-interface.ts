import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionProduct } from '@domain/subscriptions/subscription-product';
import type { SubscriptionPurchase } from '@domain/subscriptions/subscription-purchase';

/**
 * Port for the platform store (StoreKit on iOS, Play Billing on Android).
 *
 * @remarks
 * - **A cancelled purchase is a `CancelledFailure`**, so the paywall can return to
 *   its default state without showing an error.
 * - **`finish` comes after the backend has verified the purchase.** Finishing
 *   earlier would tell the store the purchase was delivered before it was.
 */
export interface SubscriptionStoreInterface {
  loadProducts(productIds: readonly string[]): Promise<Result<SubscriptionProduct[], Failure>>;
  purchase(productId: string): Promise<Result<SubscriptionPurchase, Failure>>;
  restore(productIds: readonly string[]): Promise<Result<SubscriptionPurchase[], Failure>>;
  finish(purchase: SubscriptionPurchase): Promise<Result<void, Failure>>;
}
