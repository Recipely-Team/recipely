import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';

/**
 * **Launch campaign port** — the campaigns cached on this device, and which ones it has shown.
 *
 * @remarks
 * - **Cache first.** `cached` never touches the network, so a launch reads it instantly;
 *   `refresh` asks the backend (platform and region are the adapter's) and replaces the cache
 *   for the next launch. The web build has no launch moment: both answer an empty list.
 */
export interface LaunchCampaignRepositoryInterface {
  cached(): Promise<Result<readonly LaunchCampaign[], Failure>>;
  refresh(): Promise<Result<readonly LaunchCampaign[], Failure>>;
  seenIds(): Promise<Result<ReadonlySet<string>, Failure>>;
  markSeen(id: string): Promise<Result<void, Failure>>;
}
