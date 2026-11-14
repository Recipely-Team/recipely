import type { IapModule } from '@infrastructure/subscriptions/iap-module';

const unavailable = (): Promise<never> =>
  Promise.reject(new Error('Store purchases run in the iOS and Android apps.'));

/**
 * The web half: there is no store in a browser.
 *
 * @remarks
 * - **Purchases are a mobile action.** The web sends people to the apps to
 *   subscribe, so every store call here fails and the paywall says so.
 * - **Keeps the native billing module out of the web bundle**, which it would
 *   otherwise pull in through the shared registration.
 */
export const reactNativeIapModule: IapModule = {
  connect: unavailable,
  fetchSubscriptions: unavailable,
  requestSubscription: unavailable,
  onPurchase: () => () => undefined,
  onPurchaseError: () => () => undefined,
  finish: unavailable,
  availablePurchases: unavailable,
};
