import type { TranslationsType } from '@presentation/i18n';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { CharConstants } from '@core/constants';

type SourceMarkType = Exclude<ProvenanceMarkType, typeof ProvenanceMark.Ai | typeof ProvenanceMark.Curated>;

const PLATFORM_A11Y: Record<SourceMarkType, (t: TranslationsType) => string> = {
  [ProvenanceMark.Instagram]: (t) => t.recipes.originInstagramA11y,
  [ProvenanceMark.TikTok]: (t) => t.recipes.originTiktokA11y,
  [ProvenanceMark.Facebook]: (t) => t.recipes.originFacebookA11y,
  [ProvenanceMark.YouTube]: (t) => t.recipes.originYoutubeA11y,
  [ProvenanceMark.Pinterest]: (t) => t.recipes.originPinterestA11y,
  [ProvenanceMark.Web]: (t) => t.recipes.originWebA11y,
};

/**
 * The seal's accessible name — the whole truth in one phrase, or `''` for a
 * recipe a person wrote.
 *
 * "Imported from TikTok, edited with AI" rather than two names read one after
 * the other: the capsule is one object, so a screen reader meets it once.
 */
export const provenanceLabel = (t: TranslationsType, marks: readonly ProvenanceMarkType[]): string => {
  if (marks.includes(ProvenanceMark.Curated)) return t.recipes.originCuratedA11y;
  const byModel = marks.includes(ProvenanceMark.Ai);
  const platform = marks.find(
    (mark): mark is SourceMarkType => mark !== ProvenanceMark.Ai && mark !== ProvenanceMark.Curated,
  );
  const base = platform === undefined ? null : PLATFORM_A11Y[platform](t);
  if (base === null) return byModel ? t.recipes.originAiA11y : CharConstants.empty;
  return byModel ? `${base}${t.recipes.originEditedByAiSuffix}` : base;
};
