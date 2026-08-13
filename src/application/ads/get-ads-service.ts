import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';
import { noopAdsService } from '@application/ads/noop-ads-service';

/**
 * Resolves the ad service from the DI container, falling back to an inert one
 * when none is registered. This keeps presentation/application code off a
 * concrete `@infrastructure` import — see the alarm-audio service for the same
 * shape.
 */
export const getAdsService = (): AdsServiceInterface =>
  container.has(TOKENS.AdsService)
    ? container.resolve<AdsServiceInterface>(TOKENS.AdsService)
    : noopAdsService;
