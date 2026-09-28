import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { CharConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import type { ImportSource } from '@presentation/app/notifications/model/import-source';

/** The `{handle}` slot the provenance copy leaves for the account name. */
const HANDLE_SLOT = '{handle}';
/** Instagram and TikTok accounts are written the way those platforms write them. */
const AT = '@';

const WORDS: Record<SourcePlatformType, { named: () => string; bare: () => string; prefix: string }> = {
  [SourcePlatform.Instagram]: { named: () => t().recipes.originInstagramDetailLabel, bare: () => t().recipes.originInstagramA11y, prefix: AT },
  [SourcePlatform.TikTok]: { named: () => t().recipes.originTiktokDetailLabel, bare: () => t().recipes.originTiktokA11y, prefix: AT },
  [SourcePlatform.Facebook]: { named: () => t().recipes.originFacebookDetailLabel, bare: () => t().recipes.originFacebookA11y, prefix: CharConstants.empty },
  [SourcePlatform.YouTube]: { named: () => t().recipes.originYoutubeDetailLabel, bare: () => t().recipes.originYoutubeA11y, prefix: CharConstants.empty },
  [SourcePlatform.Web]: { named: () => t().recipes.originWebDetailLabel, bare: () => t().recipes.originWebA11y, prefix: CharConstants.empty },
};

/**
 * The import row's provenance sentence — "Imported from @chef on TikTok", or
 * "Imported from TikTok" when no account was reported.
 *
 * Reuses the detail screen's `recipes.origin*` copy, so the notification and
 * the recipe it opens name the source in the same words, in every locale.
 */
export const importSourceLine = ({ platform, handle }: ImportSource): string => {
  const words = WORDS[platform];
  return handle === undefined ? words.bare() : words.named().replace(HANDLE_SLOT, `${words.prefix}${handle}`);
};
