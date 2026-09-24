import { HOST_TOKEN } from '@presentation/app/import-recipe/model/host-token';
import type { ImportLink } from '@domain/recipes/import/import-link';
import { SourcePlatform } from '@domain/recipes/provenance/source-platform';
import type { Translations } from '@presentation/i18n/translations';


/**
 * What the paste field's seal is called once it recognises a link: "Instagram
 * link", or "Recipe website: nefisyemektarifleri.com" — the site is the only
 * thing a web link's globe cannot say on its own.
 */
export const recognisedLinkLabel = (link: ImportLink, copy: Translations['importRecipe']): string => {
  if (link.platform === SourcePlatform.Web) return copy.pasteDetectedWeb.replace(HOST_TOKEN, link.host);
  return link.platform === SourcePlatform.Instagram ? copy.pasteDetectedInstagram : copy.pasteRecognised;
};
