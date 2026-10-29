import type { LaunchCampaignNone } from '@application/campaigns/states/launch-campaign-none';
import type { LaunchCampaignReady } from '@application/campaigns/states/launch-campaign-ready';

/** What the launch campaign store holds for this launch. */
export type LaunchCampaignState = LaunchCampaignNone | LaunchCampaignReady;
