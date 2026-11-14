/** The store product ids of the premium plans, as set up in App Store Connect and Play Console. */
export const PremiumProductIds = {
  Monthly: 'premium_monthly',
  Yearly: 'premium_yearly',
} as const;

/** Both plans, in the order the paywall shows them. */
export const PREMIUM_PRODUCT_IDS: readonly string[] = [PremiumProductIds.Monthly, PremiumProductIds.Yearly];
