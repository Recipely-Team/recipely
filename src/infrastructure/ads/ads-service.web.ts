import type { AdsServiceInterface } from '@domain/ads/ads-service-interface';

/**
 * Web build of the ad service. The mobile SDK has no web target and the web
 * shell serves no ads yet, so this exists to keep the native module out of the
 * web bundle entirely — importing it there fails the build rather than
 * degrading.
 */
export class AdsService implements AdsServiceInterface {
  async prepare(): Promise<boolean> {
    return false;
  }
}
