type IapProduct = { readonly id: string; readonly displayPrice: string; readonly androidOfferToken: string | null };
type IapPurchase = { readonly id: string; readonly productId: string; readonly purchaseToken: string | null };
type IapError = { readonly isCancelled: boolean; readonly message: string };

/**
 * The part of react-native-iap the subscription store uses, in the app's own terms.
 *
 * @remarks
 * - **Why a facade.** The library's types are per-platform unions; this keeps the
 *   adapter on three small shapes, and lets its tests run without the native module.
 * - **Listeners return their own unsubscribe**, so a purchase can stop listening
 *   the moment it settles.
 */
export interface IapModule {
  connect(): Promise<void>;
  fetchSubscriptions(productIds: readonly string[]): Promise<IapProduct[]>;
  requestSubscription(productId: string, androidOfferToken: string | null): Promise<void>;
  onPurchase(listener: (purchase: IapPurchase) => void): () => void;
  onPurchaseError(listener: (error: IapError) => void): () => void;
  finish(purchase: IapPurchase): Promise<void>;
  availablePurchases(): Promise<IapPurchase[]>;
}
