import { t } from '@presentation/i18n';

/** The four step names in order (spec: Post · Keywords · Recipe · Message). */
export const editorStepLabels = (): readonly string[] => {
  const copy = t().instagram;
  return [copy.stepPost, copy.stepKeywords, copy.stepRecipe, copy.stepMessage];
};
