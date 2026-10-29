import type { LaunchCampaignStatus } from '@application/campaigns/launch-campaign-status';

/** No campaign this launch — none cached, all seen, or already dismissed. */
export interface LaunchCampaignNone {
  status: typeof LaunchCampaignStatus.None;
}
