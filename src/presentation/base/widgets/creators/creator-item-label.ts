import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { t } from '@presentation/i18n';
import { creatorPlatformName } from '@presentation/base/widgets/creators/creator-platform-name';

/** "Ayşe Mutfakta, Instagram @aysemutfakta" — one name for a strip item or card, as the prototype labels them. */
export const creatorItemLabel = (creator: CreatorSummaryEntity): string =>
  t()
    .creators.itemLabel.replace('{name}', creator.displayName)
    .replace('{platform}', creatorPlatformName(creator.creator.platform))
    .replace('{handle}', creator.creator.displayHandle);
