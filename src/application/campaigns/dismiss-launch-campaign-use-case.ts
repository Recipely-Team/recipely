import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { LaunchCampaignRepositoryInterface } from '@domain/campaigns/launch-campaign-repository-interface';

/** Remembers that this device has seen a campaign, so no later launch shows it again. */
export class DismissLaunchCampaignUseCase {
  constructor(private readonly repo: LaunchCampaignRepositoryInterface) {}

  execute(campaignId: string): Promise<Result<void, Failure>> {
    return this.repo.markSeen(campaignId);
  }
}
