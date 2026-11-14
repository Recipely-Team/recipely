import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { SubscriptionVerifierInterface } from '@domain/subscriptions/subscription-verifier-interface';
import type { PremiumEntitlement } from '@domain/subscriptions/premium-entitlement';

/** Asks the backend whether the signed-in account is premium (ads, limits, the paywall's close-only state). */
export class LoadPremiumStatusUseCase {
  constructor(private readonly verifier: SubscriptionVerifierInterface) {}

  execute(): Promise<Result<PremiumEntitlement, Failure>> {
    return this.verifier.status();
  }
}
