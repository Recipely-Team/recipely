import { BaseValueObject } from '@core/value-object/base-value-object';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import { CampaignVariant } from '@domain/campaigns/campaign-variant';

/**
 * The campaigns this device holds, and the rule for which one a launch shows.
 *
 * @remarks
 * - **One at a time:** inside its window, highest priority first, then the one that opened first.
 * - **A splash repeats, a dialog does not.** A splash is a few seconds behind the logo on every
 *   launch while its window is open; a dialog is a sheet over the feed, so once per device.
 * - **The clock is the device's.** The backend sends a week ahead; a campaign opening tomorrow
 *   is shown tomorrow from the cache, with no request on the startup path.
 */
export class CampaignLineup extends BaseValueObject<readonly LaunchCampaign[]> {
  private constructor(campaigns: readonly LaunchCampaign[]) {
    super(campaigns);
  }

  static of(campaigns: readonly LaunchCampaign[]): CampaignLineup {
    return new CampaignLineup(campaigns);
  }

  pickAt(nowMs: number, seenIds: ReadonlySet<string>): LaunchCampaign | null {
    const eligible = this._value.filter(
      (campaign) =>
        campaign.startsAtMs <= nowMs &&
        nowMs < campaign.endsAtMs &&
        (campaign.variant === CampaignVariant.Splash || !seenIds.has(campaign.id)),
    );
    const [first] = [...eligible].sort((a, b) => b.priority - a.priority || a.startsAtMs - b.startsAtMs);
    return first ?? null;
  }
}
