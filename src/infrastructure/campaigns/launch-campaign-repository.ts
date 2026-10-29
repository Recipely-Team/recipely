import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { isList, isString } from '@core/guards/type-guards';
import { ValueConstants } from '@core/constants';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import type { LaunchCampaignRepositoryInterface } from '@domain/campaigns/launch-campaign-repository-interface';
import type { LaunchCampaignsResponseDto } from '@infrastructure/campaigns/launch-campaigns-response-dto';
import { toLaunchCampaigns } from '@infrastructure/campaigns/to-launch-campaigns';
import { toLaunchCampaignsQuery } from '@infrastructure/campaigns/to-launch-campaigns-query';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY, LAUNCH_CAMPAIGNS_STORAGE_KEY } from '@infrastructure/constants/storage';

/** Old ids drop off past this many; a campaign lasts weeks, so the list never needs to be long. */
const SEEN_LIMIT = 50;
const NONE: readonly LaunchCampaign[] = [];

const parseJson = (raw: string | null): unknown => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Implements `LaunchCampaignRepositoryInterface` over `GET /app/campaigns` and the key-value store.
 *
 * @remarks
 * - **The cache is the answer as received**, re-validated by the same mapper on every read, so a
 *   cache written by an older build can never smuggle in a shape this build does not accept.
 * - **Images are prefetched on refresh**, so the next launch draws the hero without waiting.
 * - **`audience` is `null` on the web** (and on a build without a version): no request, no campaigns.
 */
export class LaunchCampaignRepository implements LaunchCampaignRepositoryInterface {
  constructor(
    private readonly http: AxiosHttpClient,
    private readonly kv: KeyValueStoreInterface,
    private readonly audience: { platform: string; region: string | null } | null,
    private readonly prefetchImages: (urls: string[]) => void,
  ) {}

  async cached(): Promise<Result<readonly LaunchCampaign[], Failure>> {
    if (this.audience === null) return ok(NONE);
    const stored = await this.kv.getItem(LAUNCH_CAMPAIGNS_STORAGE_KEY);
    if (!stored.ok) return stored;
    const dto = parseJson(stored.value);
    if (dto === null || typeof dto !== 'object') return ok(NONE);
    const campaigns = toLaunchCampaigns(dto);
    return campaigns.ok ? campaigns : ok(NONE);
  }

  async refresh(): Promise<Result<readonly LaunchCampaign[], Failure>> {
    if (this.audience === null) return ok(NONE);
    const response = await this.http.get<LaunchCampaignsResponseDto>(ApiRoutes.launchCampaigns, {
      params: toLaunchCampaignsQuery(this.audience),
    });
    if (!response.ok) return response;
    const campaigns = toLaunchCampaigns(response.value);
    if (!campaigns.ok) return campaigns;
    await this.kv.setItem(LAUNCH_CAMPAIGNS_STORAGE_KEY, JSON.stringify(response.value));
    const images = campaigns.value.flatMap((campaign) => (campaign.imageUrl === null ? [] : [campaign.imageUrl]));
    if (images.length > ValueConstants.zero) this.prefetchImages(images);
    return campaigns;
  }

  async seenIds(): Promise<Result<ReadonlySet<string>, Failure>> {
    const stored = await this.kv.getItem(LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY);
    if (!stored.ok) return stored;
    return ok(new Set(this.readSeen(stored.value)));
  }

  async markSeen(id: string): Promise<Result<void, Failure>> {
    const stored = await this.kv.getItem(LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY);
    const seen = stored.ok ? this.readSeen(stored.value).filter((seenId) => seenId !== id) : [];
    return this.kv.setItem(LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY, JSON.stringify([...seen, id].slice(-SEEN_LIMIT)));
  }

  private readSeen(raw: string | null): string[] {
    const parsed = parseJson(raw);
    const list: readonly unknown[] = Array.isArray(parsed) ? parsed : [];
    return isList(list) ? list.filter(isString) : [];
  }
}
