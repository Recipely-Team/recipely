import { HOST_TOKEN } from '@presentation/app/import-recipe/model/host-token';
import type { ImportLink } from '@domain/recipes/import/import-link';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import type { TranslationsType } from '@presentation/i18n/translations';

type ImportCopy = TranslationsType['importRecipe'];

const VIDEO_LABEL: Record<Exclude<SourcePlatformType, typeof SourcePlatform.Web>, (copy: ImportCopy) => string> = {
  [SourcePlatform.Instagram]: (copy) => copy.pasteDetectedInstagram,
  [SourcePlatform.TikTok]: (copy) => copy.pasteDetectedTiktok,
  [SourcePlatform.Facebook]: (copy) => copy.pasteDetectedFacebook,
  [SourcePlatform.YouTube]: (copy) => copy.pasteDetectedYoutube,
};

/**
 * What the paste field's seal is called once it recognises a link: "YouTube
 * link", or "Recipe website: nefisyemektarifleri.com" — the site is the only
 * thing a web link's globe cannot say on its own.
 */
export const recognisedLinkLabel = (link: ImportLink, copy: ImportCopy): string =>
  link.platform === SourcePlatform.Web
    ? copy.pasteDetectedWeb.replace(HOST_TOKEN, link.host)
    : VIDEO_LABEL[link.platform](copy);
