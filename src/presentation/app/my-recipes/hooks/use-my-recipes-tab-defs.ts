import { useMemo } from 'react';
import type { ListPaging } from '@application/store/paging/list-paging/list-paging';
import { t } from '@presentation/i18n';
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
  paging: { savedPaging: ListPaging; likedPaging: ListPaging; createdPaging: ListPaging },
): readonly MyRecipesTab[] =>
  useMemo(
    () => [
      { key: TabType.Saved, label: t().myRecipes.saved, count: Math.max(paging.savedPaging.total, loaded.saved) },
      { key: TabType.Liked, label: t().myRecipes.liked, count: Math.max(paging.likedPaging.total, loaded.liked) },
      { key: TabType.Created, label: t().myRecipes.created, count: Math.max(paging.createdPaging.total, loaded.created) },
      { key: TabType.Drafts, label: t().myRecipes.drafts, count: draftsTotal },
    ],
    [loaded.saved, loaded.liked, loaded.created, draftsTotal, paging.savedPaging.total, paging.likedPaging.total, paging.createdPaging.total],
  );
