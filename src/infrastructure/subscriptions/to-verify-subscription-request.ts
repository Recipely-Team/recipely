import type { RequestMapper } from '@core/mapper/request-mapper';
import type { SubscriptionPurchase } from '@domain/subscriptions/subscription-purchase';
import type { VerifySubscriptionRequestDto } from '@infrastructure/subscriptions/dtos/verify-subscription-request-dto';

type StorePurchase = { readonly purchase: SubscriptionPurchase; readonly platform: VerifySubscriptionRequestDto['platform'] };

/** The purchase and the store it came from, as the verify endpoint takes them. */
export const toVerifySubscriptionRequest: RequestMapper<StorePurchase, VerifySubscriptionRequestDto> = ({ purchase, platform }) => ({
  platform,
  productId: purchase.productId,
  transactionId: purchase.transactionId,
  purchaseToken: purchase.purchaseToken,
});
