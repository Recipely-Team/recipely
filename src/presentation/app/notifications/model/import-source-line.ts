import type { TranslationsType } from '@presentation/i18n';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { CharConstants } from '@core/constants';
import type { ImportSource } from '@presentation/app/notifications/model/import-source';

/** The `{handle}` slot the provenance copy leaves for the account name. */
const HANDLE_SLOT = '{handle}';
/** Instagram and TikTok accounts are written the way those platforms write them. */
const AT = CharConstants.at;

const WORDS: Record<SourcePlatformType, { named: (t: TranslationsType) => string; bare: (t: TranslationsType) => string; prefix: string }> = {
  [SourcePlatform.Instagram]: { named: (t) => t.recipes.originInstagramDetailLabel, bare: (t) => t.recipes.originInstagramA11y, prefix: AT },
  [SourcePlatform.TikTok]: { named: (t) => t.recipes.originTiktokDetailLabel, bare: (t) => t.recipes.originTiktokA11y, prefix: AT },
  [SourcePlatform.Facebook]: { named: (t) => t.recipes.originFacebookDetailLabel, bare: (t) => t.recipes.originFacebookA11y, prefix: CharConstants.empty },
  [SourcePlatform.YouTube]: { named: (t) => t.recipes.originYoutubeDetailLabel, bare: (t) => t.recipes.originYoutubeA11y, prefix: CharConstants.empty },
  [SourcePlatform.Pinterest]: { named: (t) => t.recipes.originPinterestDetailLabel, bare: (t) => t.recipes.originPinterestA11y, prefix: CharConstants.empty },
  [SourcePlatform.Web]: { named: (t) => t.recipes.originWebDetailLabel, bare: (t) => t.recipes.originWebA11y, prefix: CharConstants.empty },
};

/**
 * The import row's provenance sentence — "Imported from @chef on TikTok", or
 * "Imported from TikTok" when no account was reported.
 *
 * Reuses the detail screen's `recipes.origin*` copy, so the notification and
 * the recipe it opens name the source in the same words, in every locale.
 */
export const importSourceLine = (t: TranslationsType, { platform, handle }: ImportSource): string => {
  const words = WORDS[platform];
  return handle === undefined ? words.bare(t) : words.named(t).replace(HANDLE_SLOT, `${words.prefix}${handle}`);
};
