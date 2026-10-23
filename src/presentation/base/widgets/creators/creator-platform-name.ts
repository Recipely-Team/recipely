import type { TranslationsType } from '@presentation/i18n';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';

/** The platform's own name, for labels and screen readers; read lazily so it follows the locale. */
export const creatorPlatformName = (t: TranslationsType, platform: CreatorPlatformType): string =>
  platform === CreatorPlatform.TikTok ? t.creators.platformTiktok : t.creators.platformInstagram;
