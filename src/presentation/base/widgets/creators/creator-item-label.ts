import type { TranslationsType } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';

/**
 * "Ayşe Mutfakta, Instagram @aysemutfakta, TikTok @ayse.mutfakta" — one name
 * for a card: the creator, then every verified account, primary first.
 */
export const creatorItemLabel = (t: TranslationsType, creator: CreatorSummaryEntity): string => {
  const [primary, ...others] = creator.creatorTags;
  if (primary === undefined) return creator.displayName;
  const first = t
    .creators.itemLabel.replace('{name}', creator.displayName)
    .replace('{platform}', creatorPlatformName(t, primary.platform))
    .replace('{handle}', primary.displayHandle);
  return [first, ...others.map((tag) => [creatorPlatformName(t, tag.platform), tag.displayHandle].join(CharConstants.space))].join(
    CharConstants.commaSpace,
  );
};
