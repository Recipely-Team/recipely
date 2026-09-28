import { ImportLink } from '@domain/recipes/import/import-link';
import { CharConstants, ValueConstants } from '@core/constants';

const URL_IN_TEXT = /https?:\/\/\S+/;
/** Punctuation a sentence puts after a link, which is not part of it. */
const TRAILING_PUNCTUATION = /[).,;:!?'"»\]]+$/;

/**
 * The importable link in an incoming share, or `null`.
 *
 * @remarks
 * - **`webUrl` first**, since a browser share hands over the page itself.
 * - **Text only yields a link it actually contains.** A share like
 *   "Menemen.Tarifi" is words, not `https://menemen.tarifi/`; guessing it was a
 *   host sent strangers' captions off to be fetched.
 * - **A link at the end of a sentence loses the sentence's punctuation**, so
 *   "…see https://site.com/recipe)." imports the recipe, not a 404.
 */
export const extractImportUrl = (text?: string | null, webUrl?: string | null): string | null => {
  const inText = text?.match(URL_IN_TEXT)?.[ValueConstants.zero]?.replace(TRAILING_PUNCTUATION, CharConstants.empty);
  for (const candidate of [webUrl?.trim(), inText]) {
    if (candidate === undefined || candidate.length === ValueConstants.zero) continue;
    const link = ImportLink.create(candidate);
    if (link.ok) return link.value.value;
  }
  return null;
};
