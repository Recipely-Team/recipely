import { useMemo } from 'react';
import { useTranslations } from '@presentation/i18n';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import type { MyRecipesTab } from '@presentation/app/my-recipes/model/my-recipes-tab';

/**
 * The four My Recipes tabs with their counts. A count is the server's total,
 * never the rows loaded so far — a 31-recipe account read "20" before its
 * second page — and never less than what is on screen.
 */
export const useMyRecipesTabDefs = (
  loaded: { saved: number; liked: number; created: number },
  draftsTotal: number,
  totals: { saved: number; liked: number; created: number },
): readonly MyRecipesTab[] =>
  {
  const t = useTranslations();
  return useMemo(
    () => [
      { key: TabType.Saved, label: t.myRecipes.saved, count: Math.max(totals.saved, loaded.saved) },
      { key: TabType.Liked, label: t.myRecipes.liked, count: Math.max(totals.liked, loaded.liked) },
      { key: TabType.Created, label: t.myRecipes.created, count: Math.max(totals.created, loaded.created) },
      { key: TabType.Drafts, label: t.myRecipes.drafts, count: draftsTotal },
    ],
    [loaded.saved, loaded.liked, loaded.created, draftsTotal, totals.saved, totals.liked, totals.created, t],
  );
};
