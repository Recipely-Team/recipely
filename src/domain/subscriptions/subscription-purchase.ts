/**
 * A purchase the store reported, before the backend has confirmed it.
 *
 * @remarks
 * - **Not an entitlement.** The backend verifies it with the store and only then
 *   grants premium; this is what the app sends for that check.
 * - **`purchaseToken` is Google's**, needed to verify an Android purchase; Apple
 *   purchases are verified by `transactionId` alone.
 */
export interface SubscriptionPurchase {
  readonly productId: string;
  readonly transactionId: string;
  readonly purchaseToken: string | null;
}
