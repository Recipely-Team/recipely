import type { DevicePlatform } from '@domain/notifications/device-platform';

// Body of `POST /subscriptions/verify` — the store purchase the backend checks with Apple or Google.
export interface VerifySubscriptionRequestDto {
  platform: typeof DevicePlatform.Ios | typeof DevicePlatform.Android;
  productId: string;
  transactionId: string;
  purchaseToken: string | null;
}
