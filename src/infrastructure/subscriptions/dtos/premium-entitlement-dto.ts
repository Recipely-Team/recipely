// Answer of `POST /subscriptions/verify` — the entitlement the backend stored after checking the store.
export interface PremiumEntitlementDto {
  isPremium: boolean;
  expiresAt?: string | null;
}
