import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionVerifierInterface } from '@domain/subscriptions/subscription-verifier-interface';
import type { SubscriptionPurchase } from '@domain/subscriptions/subscription-purchase';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { DevicePlatform } from '@domain/notifications/device-platform';
import { currentDevicePlatform } from '@infrastructure/device/current-device-platform';
import type { PremiumEntitlementDto } from '@infrastructure/subscriptions/dtos/premium-entitlement-dto';
import { toVerifySubscriptionRequest } from '@infrastructure/subscriptions/to-verify-subscription-request';
import { toPremiumEntitlement } from '@infrastructure/subscriptions/to-premium-entitlement';

/**
 * Sends a store purchase to the backend, which verifies it and grants premium.
 *
 * @remarks
 * - **The platform rides with the purchase**, because Apple and Google purchases are
 *   verified differently (a transaction id against a purchase token).
 */
export class SubscriptionVerifierRepository implements SubscriptionVerifierInterface {
  constructor(private readonly http: AxiosHttpClient) {}

  async verify(purchase: SubscriptionPurchase): Promise<Result<PremiumEntitlement, Failure>> {
    const platform = currentDevicePlatform() === DevicePlatform.Ios ? DevicePlatform.Ios : DevicePlatform.Android;
    const result = await this.http.post<PremiumEntitlementDto>(
      ApiRoutes.subscriptions.verify,
      toVerifySubscriptionRequest({ purchase, platform }),
    );
    return result.ok ? toPremiumEntitlement(result.value) : result;
  }

  async status(): Promise<Result<PremiumEntitlement, Failure>> {
    const result = await this.http.get<PremiumEntitlementDto>(ApiRoutes.subscriptions.status);
    return result.ok ? toPremiumEntitlement(result.value) : result;
  }
}
