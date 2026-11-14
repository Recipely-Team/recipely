import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'react-native-iap';
import type { IapModule } from '@infrastructure/subscriptions/iap-module';

const SUBSCRIPTION_TYPE = 'subs';

const toPurchase = (purchase: Purchase) => ({
  id: purchase.id,
  productId: purchase.productId,
  purchaseToken: purchase.purchaseToken ?? null,
});

type FetchedProduct = NonNullable<Awaited<ReturnType<typeof fetchProducts>>>[number];

/** The first Android offer token of a subscription, which Play Billing needs to buy it. */
const androidOfferToken = (product: FetchedProduct): string | null => {
  if (!('subscriptionOffers' in product)) return null;
  const offer = product.subscriptionOffers?.find((candidate) => candidate.offerTokenAndroid);
  return offer?.offerTokenAndroid ?? null;
};

/**
 * react-native-iap bound to the facade the store adapter uses.
 *
 * @remarks
 * - **Store-native under the hood.** StoreKit on iOS and Play Billing on Android,
 *   both through the library's Nitro module; no billing code of our own.
 * - **Kept tiny on purpose.** It maps names and shapes only; every decision lives
 *   in the adapter, where it is tested.
 */
export const reactNativeIapModule: IapModule = {
  connect: async () => {
    await initConnection();
  },
  fetchSubscriptions: async (productIds) => {
    const products = (await fetchProducts({ skus: [...productIds], type: SUBSCRIPTION_TYPE })) ?? [];
    return products.map((product) => ({
      id: product.id,
      displayPrice: product.displayPrice,
      androidOfferToken: androidOfferToken(product),
    }));
  },
  requestSubscription: async (productId, offerToken) => {
    await requestPurchase({
      request: {
        apple: { sku: productId },
        google: {
          skus: [productId],
          ...(offerToken === null ? {} : { subscriptionOffers: [{ sku: productId, offerToken }] }),
        },
      },
      type: SUBSCRIPTION_TYPE,
    });
  },
  onPurchase: (listener) => {
    const subscription = purchaseUpdatedListener((purchase) => listener(toPurchase(purchase)));
    return () => subscription.remove();
  },
  onPurchaseError: (listener) => {
    const subscription = purchaseErrorListener((error) =>
      listener({ isCancelled: error.code === ErrorCode.UserCancelled, message: error.message }),
    );
    return () => subscription.remove();
  },
  finish: async (purchase) => {
    const available = await getAvailablePurchases();
    const raw = available.find((candidate) => candidate.id === purchase.id);
    if (raw !== undefined) await finishTransaction({ purchase: raw, isConsumable: false });
  },
  availablePurchases: async () => (await getAvailablePurchases()).map(toPurchase),
};
