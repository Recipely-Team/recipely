import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { t } from '@presentation/i18n';

/** The platform's own name, for labels and screen readers; read lazily so it follows the locale. */
export const creatorPlatformName = (platform: CreatorPlatformType): string =>
  platform === CreatorPlatform.TikTok ? t().creators.platformTiktok : t().creators.platformInstagram;
