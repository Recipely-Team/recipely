import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { t } from '@presentation/i18n';

type SourceMarkType = Exclude<ProvenanceMarkType, typeof ProvenanceMark.Ai>;

const PLATFORM_A11Y: Record<SourceMarkType, () => string> = {
  [ProvenanceMark.Instagram]: () => t().recipes.originInstagramA11y,
  [ProvenanceMark.TikTok]: () => t().recipes.originTiktokA11y,
  [ProvenanceMark.Facebook]: () => t().recipes.originFacebookA11y,
  [ProvenanceMark.YouTube]: () => t().recipes.originYoutubeA11y,
  [ProvenanceMark.Web]: () => t().recipes.originWebA11y,
};

/**
 * The seal's accessible name — the whole truth in one phrase, or `''` for a
 * recipe a person wrote.
 *
 * "Imported from TikTok, edited with AI" rather than two names read one after
 * the other: the capsule is one object, so a screen reader meets it once.
 */
export const provenanceLabel = (marks: readonly ProvenanceMarkType[]): string => {
  const byModel = marks.includes(ProvenanceMark.Ai);
  const platform = marks.find((mark): mark is SourceMarkType => mark !== ProvenanceMark.Ai);
  const base = platform === undefined ? null : PLATFORM_A11Y[platform]();
  if (base === null) return byModel ? t().recipes.originAiA11y : '';
  return byModel ? `${base}${t().recipes.originEditedByAiSuffix}` : base;
};
