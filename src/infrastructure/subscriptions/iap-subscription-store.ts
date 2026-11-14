import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { CancelledFailure, UnknownFailure, type Failure } from '@core/failure';
import type { SubscriptionStoreInterface } from '@domain/subscriptions/subscription-store-interface';
import type { SubscriptionProduct } from '@domain/subscriptions/subscription-product';
import type { SubscriptionPurchase } from '@domain/subscriptions/subscription-purchase';
import type { IapModule } from '@infrastructure/subscriptions/iap-module';

const describe = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * The subscription store, on StoreKit and Play Billing through react-native-iap.
 *
 * @remarks
 * - **Connects once, lazily.** The first call opens the store connection; later
 *   calls reuse it.
 * - **A purchase settles on the first matching event.** The store answers through
 *   listeners, not the request's promise, so the purchase listens for its own
 *   product's update or for an error, and stops listening as soon as one arrives.
 * - **Android needs an offer token**, which comes from `loadProducts`; buying a
 *   product that was never loaded sends none, and Play Billing refuses it.
 */
export class IapSubscriptionStore implements SubscriptionStoreInterface {
  private connection: Promise<void> | null = null;
  private readonly offerTokens = new Map<string, string | null>();

  constructor(private readonly iap: IapModule) {}

  async loadProducts(productIds: readonly string[]): Promise<Result<SubscriptionProduct[], Failure>> {
    try {
      await this.connect();
      const products = await this.iap.fetchSubscriptions(productIds);
      for (const product of products) this.offerTokens.set(product.id, product.androidOfferToken);
      return ok(products.map(({ id, displayPrice }) => ({ id, displayPrice })));
    } catch (error) {
      return fail(new UnknownFailure(describe(error), error));
    }
  }

  async purchase(productId: string): Promise<Result<SubscriptionPurchase, Failure>> {
    try {
      await this.connect();
    } catch (error) {
      return fail(new UnknownFailure(describe(error), error));
    }
    return new Promise((resolve) => {
      const settle = (result: Result<SubscriptionPurchase, Failure>): void => {
        stopPurchase();
        stopError();
        resolve(result);
      };
      const stopPurchase = this.iap.onPurchase((purchase) => {
        if (purchase.productId !== productId) return;
        settle(ok({ productId: purchase.productId, transactionId: purchase.id, purchaseToken: purchase.purchaseToken }));
      });
      const stopError = this.iap.onPurchaseError((error) =>
        settle(fail(error.isCancelled ? new CancelledFailure() : new UnknownFailure(error.message))),
      );
      this.iap
        .requestSubscription(productId, this.offerTokens.get(productId) ?? null)
        .catch((error: unknown) => settle(fail(new UnknownFailure(describe(error), error))));
    });
  }

  async restore(productIds: readonly string[]): Promise<Result<SubscriptionPurchase[], Failure>> {
    try {
      await this.connect();
      const purchases = await this.iap.availablePurchases();
      return ok(
        purchases
          .filter((purchase) => productIds.includes(purchase.productId))
          .map((purchase) => ({ productId: purchase.productId, transactionId: purchase.id, purchaseToken: purchase.purchaseToken })),
      );
    } catch (error) {
      return fail(new UnknownFailure(describe(error), error));
    }
  }

  async finish(purchase: SubscriptionPurchase): Promise<Result<void, Failure>> {
    try {
      await this.iap.finish({ id: purchase.transactionId, productId: purchase.productId, purchaseToken: purchase.purchaseToken });
      return ok(undefined);
    } catch (error) {
      return fail(new UnknownFailure(describe(error), error));
    }
  }

  private connect(): Promise<void> {
    this.connection ??= this.iap.connect().catch((error: unknown) => {
      this.connection = null;
      throw error;
    });
    return this.connection;
  }
}
