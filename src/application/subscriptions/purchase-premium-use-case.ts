import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionStoreInterface } from '@domain/subscriptions/subscription-store-interface';
import type { SubscriptionVerifierInterface } from '@domain/subscriptions/subscription-verifier-interface';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';

/**
 * Buys a premium plan: the store sheet, then the backend's check, then finishing the purchase.
 *
 * @remarks
 * - **Finish last.** The store transaction is finished only after the backend has
 *   verified it. A purchase left unfinished is offered again by the store, so a
 *   verification that failed on a bad connection can be retried by restoring.
 * - **A cancelled sheet is a `CancelledFailure`**, passed through unchanged so the
 *   paywall returns to its default state without an error.
 */
export class PurchasePremiumUseCase {
  constructor(
    private readonly store: SubscriptionStoreInterface,
    private readonly verifier: SubscriptionVerifierInterface,
  ) {}

  async execute(productId: string): Promise<Result<PremiumEntitlement, Failure>> {
    const purchase = await this.store.purchase(productId);
    if (!purchase.ok) return purchase;
    const entitlement = await this.verifier.verify(purchase.value);
    if (!entitlement.ok) return entitlement;
    const finished = await this.store.finish(purchase.value);
    if (!finished.ok) return fail(finished.failure);
    return ok(entitlement.value);
  }
}
