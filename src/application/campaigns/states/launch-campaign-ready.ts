import type { LaunchCampaignStatus } from '@application/campaigns/launch-campaign-status';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';

/** A campaign picked from the cache, shown as soon as the screen allows it. */
export interface LaunchCampaignReady {
  status: typeof LaunchCampaignStatus.Ready;
  campaign: LaunchCampaign;
}
