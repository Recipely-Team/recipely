import type { LaunchCampaignState } from '@application/campaigns/launch-campaign-state';

export interface LaunchCampaignStore {
  state: LaunchCampaignState;
  /** Once per app start: picks from the cache, then refreshes the cache in the background for the next launch. */
  prepare: () => Promise<void>;
  /** Skip, close, Not now, the CTA or the auto-close: never shown again on this device. */
  dismiss: () => Promise<void>;
}
