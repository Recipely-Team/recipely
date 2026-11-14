import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionStoreInterface } from '@domain/subscriptions/subscription-store-interface';
import type { SubscriptionVerifierInterface } from '@domain/subscriptions/subscription-verifier-interface';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';
import { PREMIUM_PRODUCT_IDS } from '@application/subscriptions/premium-product-ids';

/**
 * Restores premium from purchases the store already holds for this account.
 *
 * @remarks
 * - **`null` means nothing to restore**, which the paywall says in words; it is not an error.
 * - **The backend checks each one** and the first that grants premium wins, so an
 *   expired old purchase next to a current one still restores.
 * - **Every verified purchase is finished**, including one left over from a
 *   purchase whose verification failed earlier.
 */
export class RestorePremiumUseCase {
  constructor(
    private readonly store: SubscriptionStoreInterface,
    private readonly verifier: SubscriptionVerifierInterface,
  ) {}

  async execute(): Promise<Result<PremiumEntitlement | null, Failure>> {
    const purchases = await this.store.restore(PREMIUM_PRODUCT_IDS);
    if (!purchases.ok) return purchases;
    let lastFailure: Result<PremiumEntitlement | null, Failure> = ok(null);
    for (const purchase of purchases.value) {
      const entitlement = await this.verifier.verify(purchase);
      if (!entitlement.ok) {
        lastFailure = entitlement;
        continue;
      }
      await this.store.finish(purchase);
      if (entitlement.value.isPremium) return ok(entitlement.value);
    }
    return lastFailure;
  }
}
