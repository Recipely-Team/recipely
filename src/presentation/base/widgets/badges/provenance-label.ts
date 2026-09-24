import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { t } from '@presentation/i18n';

/**
 * The seal's accessible name — the whole truth in one phrase, or `''` for a
 * recipe a person wrote.
 *
 * "Imported from TikTok, written by AI" rather than two names read one after
 * the other: the capsule is one object, so a screen reader meets it once.
 */
export const provenanceLabel = (marks: readonly ProvenanceMarkType[]): string => {
  const byModel = marks.includes(ProvenanceMark.Ai);
  const base = marks.includes(ProvenanceMark.Instagram)
    ? t().recipes.originInstagramA11y
    : marks.includes(ProvenanceMark.TikTok)
      ? t().recipes.originTiktokA11y
      : null;
  if (base === null) return byModel ? t().recipes.originAiA11y : '';
  return byModel ? `${base}${t().recipes.originWrittenByAiSuffix}` : base;
};
