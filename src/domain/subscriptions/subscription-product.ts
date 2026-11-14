/**
 * A subscription the store offers, with the price as the store wants it shown.
 *
 * @remarks
 * - **The price is the store's string.** It is already localized and includes the
 *   currency; the app never formats or computes a price itself.
 */
export interface SubscriptionProduct {
  readonly id: string;
  readonly displayPrice: string;
}
