import { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useStore } from 'zustand';
import { loadedItems } from '@application/store/paging/loaded-items';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * The four My Recipes lists — Saved, Liked, Created, Drafts — as their states and their rows.
 *
 * @remarks
 * - **Each list loads on focus, not mount**: the screen stays mounted behind
 *   the create flow, so a recipe published there must appear on return.
 * - **One subscription per list**, so a page arriving for one tab does not
 *   re-render the rows of another.
 */
export const useMyRecipesLists = () => {
  const { savedRecipesStore, likedRecipesStore, myRecipesStore, draftsStore } = useStores();
  const savedListState = useStore(savedRecipesStore, (s) => s.saved);
  const likedListState = useStore(likedRecipesStore, (s) => s.liked);
  const createdListState = useStore(myRecipesStore, (s) => s.mine);
  const draftsListState = useStore(draftsStore, (s) => s.drafts);
  const loadMoreDrafts = useStore(draftsStore, (s) => s.loadMoreDrafts);

  useFocusEffect(
    useCallback(() => {
      void savedRecipesStore.getState().loadSaved();
      void likedRecipesStore.getState().loadLiked();
      void myRecipesStore.getState().loadMine();
      void draftsStore.getState().loadDrafts();
    }, [savedRecipesStore, likedRecipesStore, myRecipesStore, draftsStore]),
  );

  return {
    savedListState,
    likedListState,
    createdListState,
    draftsListState,
    savedRecipes: useMemo(() => loadedItems(savedListState), [savedListState]),
    likedRecipes: useMemo(() => loadedItems(likedListState), [likedListState]),
    createdRecipes: useMemo(() => loadedItems(createdListState), [createdListState]),
    drafts: useMemo(() => loadedItems(draftsListState), [draftsListState]),
    loadMoreDrafts,
  };
};
