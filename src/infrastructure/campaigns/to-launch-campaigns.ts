import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Mapper } from '@core/mapper/mapper';
import { isNonEmptyString, isObject, isString } from '@core/guards/type-guards';
import { CharConstants, RegexConstants, UrlConstants, ValueConstants } from '@core/constants';
import { CampaignArt, type CampaignArtType } from '@domain/campaigns/campaign-art';
import { CampaignVariant, type CampaignVariantType } from '@domain/campaigns/campaign-variant';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import type { LaunchCampaignsResponseDto } from '@infrastructure/campaigns/launch-campaigns-response-dto';
import type { LaunchCampaignDto } from '@infrastructure/campaigns/launch-campaign-dto';

const VARIANTS: readonly unknown[] = Object.values(CampaignVariant);
const ARTS: readonly unknown[] = Object.values(CampaignArt);

const linkOrNull = (value: unknown): string | null => {
  if (!isString(value)) return null;
  const isInApp = value.startsWith(CharConstants.slash) && !value.startsWith(CharConstants.slash + CharConstants.slash);
  return value.startsWith(UrlConstants.httpsScheme) || isInApp ? value : null;
};

const toCampaign = (item: unknown): LaunchCampaign | null => {
  if (!isObject(item)) return null;
  const raw: LaunchCampaignDto = item;
  if (!isNonEmptyString(raw.id) || !isNonEmptyString(raw.title) || !VARIANTS.includes(raw.variant)) return null;
  const startsAtMs = isString(raw.startsAt) ? Date.parse(raw.startsAt) : Number.NaN;
  const endsAtMs = isString(raw.endsAt) ? Date.parse(raw.endsAt) : Number.NaN;
  if (Number.isNaN(startsAtMs) || Number.isNaN(endsAtMs) || endsAtMs <= startsAtMs) return null;
  if (!isString(raw.colorStart) || !isString(raw.colorEnd)) return null;
  if (!RegexConstants.hexColor6.test(raw.colorStart) || !RegexConstants.hexColor6.test(raw.colorEnd)) return null;
  const imageUrl = linkOrNull(raw.imageUrl);
  return {
    id: raw.id,
    variant: raw.variant as CampaignVariantType,
    art: ARTS.includes(raw.art) ? (raw.art as CampaignArtType) : CampaignArt.None,
    colorStart: raw.colorStart,
    colorEnd: raw.colorEnd,
    imageUrl: imageUrl?.startsWith(UrlConstants.httpsScheme) === true ? imageUrl : null,
    title: raw.title,
    body: isString(raw.body) ? raw.body : CharConstants.empty,
    ctaLabel: isNonEmptyString(raw.ctaLabel) ? raw.ctaLabel : null,
    ctaLink: linkOrNull(raw.ctaLink),
    startsAtMs,
    endsAtMs,
    priority: typeof raw.priority === 'number' && Number.isFinite(raw.priority) ? raw.priority : ValueConstants.zero,
  };
};

/**
 * Maps `GET /app/campaigns` (or the cached copy of it) onto launch campaigns.
 *
 * @remarks
 * - **One bad campaign drops itself**, not the list: a newer variant, a missing title, an inverted
 *   window or a non-hex colour skips that entry, and every other campaign still shows.
 * - **Links are re-checked here** — only `https://` or an in-app `/path`; the image only `https://`.
 */
export const toLaunchCampaigns: Mapper<LaunchCampaignsResponseDto, readonly LaunchCampaign[], ValidationFailure> = (dto) => {
  if (!Array.isArray(dto.campaigns)) return fail(new ValidationFailure(DiagnosticMessage.launchCampaigns.notAList));
  const campaigns: unknown[] = dto.campaigns;
  return ok(campaigns.map(toCampaign).filter((campaign): campaign is LaunchCampaign => campaign !== null));
};
