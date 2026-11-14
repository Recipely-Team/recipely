import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionStoreInterface } from '@domain/subscriptions/subscription-store-interface';
import type { SubscriptionProduct } from '@domain/subscriptions/subscription-product';
import { PREMIUM_PRODUCT_IDS } from '@application/subscriptions/premium-product-ids';

/** Loads the premium plans with the price the store wants shown. */
export class LoadPremiumPlansUseCase {
  constructor(private readonly store: SubscriptionStoreInterface) {}

  execute(): Promise<Result<SubscriptionProduct[], Failure>> {
    return this.store.loadProducts(PREMIUM_PRODUCT_IDS);
  }
}
