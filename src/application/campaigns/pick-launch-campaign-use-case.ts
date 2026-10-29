import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { CampaignLineup } from '@domain/campaigns/campaign-lineup';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import type { LaunchCampaignRepositoryInterface } from '@domain/campaigns/launch-campaign-repository-interface';

/** The campaign this launch shows, from the device cache only — `null` when there is none to show. */
export class PickLaunchCampaignUseCase {
  constructor(
    private readonly repo: LaunchCampaignRepositoryInterface,
    private readonly now: () => number = Date.now,
  ) {}

  async execute(): Promise<Result<LaunchCampaign | null, Failure>> {
    const [campaigns, seen] = await Promise.all([this.repo.cached(), this.repo.seenIds()]);
    if (!campaigns.ok) return campaigns;
    if (!seen.ok) return seen;
    return ok(CampaignLineup.of(campaigns.value).pickAt(this.now(), seen.value));
  }
}
