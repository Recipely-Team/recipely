import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import type { LaunchCampaignRepositoryInterface } from '@domain/campaigns/launch-campaign-repository-interface';

/** Replaces the device's campaign cache from the backend — for the next launch, never this one. */
export class RefreshLaunchCampaignsUseCase {
  constructor(private readonly repo: LaunchCampaignRepositoryInterface) {}

  execute(): Promise<Result<readonly LaunchCampaign[], Failure>> {
    return this.repo.refresh();
  }
}
