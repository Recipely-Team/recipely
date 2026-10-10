import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { useCallback, useMemo } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { StyleSheet, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ScreenContainer } from '@presentation/base/widgets/layout/screen-container';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import type { MyRecipesTab } from '@presentation/app/my-recipes/model/my-recipes-tab';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { WebMyRecipesHeader } from '@presentation/app/my-recipes/body/web-my-recipes-header';
import { WebMyRecipesTabs } from '@presentation/app/my-recipes/body/web-my-recipes-tabs';
import { MyRecipesHeader } from '@presentation/app/my-recipes/body/my-recipes-header';
import { MyRecipesTabs } from '@presentation/app/my-recipes/body/my-recipes-tabs';
import { MyRecipesList } from '@presentation/app/my-recipes/body/my-recipes-list';
import { useMyRecipesTab } from '@presentation/app/my-recipes/hooks/use-my-recipes-tab';
import { useMyRecipesAssistant } from '@presentation/app/my-recipes/hooks/use-my-recipes-assistant';
import { useMyRecipesRefresh } from '@presentation/app/my-recipes/hooks/use-my-recipes-refresh';
import { gridColumnsFor } from '@presentation/app/my-recipes/model/grid-columns-for';
import { isFirstLoad } from '@presentation/app/my-recipes/model/is-first-load';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { RoutePaths } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

export const MyRecipesScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const { isWebShell, isExpanded, width } = useLayout();
  const { savedRecipesStore, likedRecipesStore, createdRecipesStore, draftsStore } = useStores();
  const { isSaved, toggleSave } = useSaveRecipe();

  const savedRecipes = savedRecipesStore((s) => s.savedRecipes);
  const savedListState = savedRecipesStore((s) => s.listState);
  const likedRecipes = likedRecipesStore((s) => s.likedRecipes);
  const likedListState = likedRecipesStore((s) => s.listState);
  const createdRecipes = createdRecipesStore((s) => s.recipes);
  const createdListState = createdRecipesStore((s) => s.myRecipesState);
  const draftsListState = draftsStore((s) => s.drafts);
  const drafts = useMemo(() => loadedItems(draftsListState), [draftsListState]);
  const loadMoreDrafts = draftsStore((s) => s.loadMoreDrafts);

  const [tab, setTab] = useMyRecipesTab();
  const { isRefreshing, onRefresh } = useMyRecipesRefresh(tab);

  const gridColumns = useMemo(() => gridColumnsFor(isExpanded, width), [isExpanded, width]);

  // On focus, not mount: the screen stays mounted behind the create flow.
  useFocusEffect(
    useCallback(() => {
      void savedRecipesStore.getState().loadSaved();
      void likedRecipesStore.getState().loadLiked();
      void createdRecipesStore.getState().loadMyRecipes();
      void draftsStore.getState().loadDrafts();
    }, [savedRecipesStore, likedRecipesStore, createdRecipesStore, draftsStore]),
  );

  const items =
    tab === TabType.Saved ? savedRecipes : tab === TabType.Liked ? likedRecipes : createdRecipes;

  // Each tab owns its load, so skeleton and error read the shown tab.
  const activeState =
    tab === TabType.Saved
      ? savedListState
      : tab === TabType.Liked
        ? likedListState
        : tab === TabType.Created
          ? createdListState
          : draftsListState;
  const activeCount = tab === TabType.Drafts ? drafts.length : items.length;
  const isTabFirstLoad = isFirstLoad(activeState.status, activeCount);
  // Trustworthy rows vs. finished waiting: a failed load ends the wait but is not an answer.
  const tabListState =
    activeState.status === StoreStatus.Loaded
      ? ListState.Ready
      : activeState.status === StoreStatus.Error
        ? ListState.Failed
        : ListState.Loading;
  const isTabSettled = activeState.status === StoreStatus.Loaded || activeState.status === StoreStatus.Error;
  // A failed load must not read as an empty list.
  const loadFailure = activeState.status === StoreStatus.Error ? activeState.failure : null;
  useReportFailure(loadFailure, 'MyRecipesScreen');

  const tabDefs: readonly MyRecipesTab[] = [
    { key: TabType.Saved, label: t().myRecipes.saved, count: savedRecipes.length },
    { key: TabType.Liked, label: t().myRecipes.liked, count: likedRecipes.length },
    { key: TabType.Created, label: t().myRecipes.created, count: createdRecipes.length },
    { key: TabType.Drafts, label: t().myRecipes.drafts, count: drafts.length },
  ];

  // Stable handlers, so the list's memoised rows and `renderItem` hold across renders.
  const openRecipe = useCallback((id: string): void => router.push(RoutePaths.recipeDetail(id) as Href), [router]);

  const openCreate = (): void => {
    router.push(RoutePaths.createRecipe);
  };

  const openDraft = useCallback(
    (id: string): void => router.push({ pathname: RoutePaths.createRecipe, params: { draftId: id } }),
    [router],
  );

  const deleteDraft = useCallback(async (id: string): Promise<void> => {
    const result = await draftsStore.getState().deleteDraft(id);
    if (!result.ok) showErrorToast(result.failure);
  }, [draftsStore]);

  const assistant = useMyRecipesAssistant({
    tab,
    items,
    drafts,
    tabListState,
    isTabSettled,
    setTab,
    openRecipe,
    openDraft,
    deleteDraft,
    onRefresh,
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ConfirmSheet
        visible={assistant.isDraftDeletePending}
        title={t().assistant.deleteDraftTitle}
        message={t().assistant.deleteDraftMessage}
        confirmLabel={t().myRecipes.deleteRecipe}
        destructive
        onConfirm={assistant.confirmDraftDelete}
        onClose={assistant.cancelDraftDelete}
      />
      <ScreenContainer scrollable={false} padded={false}>
        <ResponsiveContainer route="myRecipes" gutter={false} fill>
          {isWebShell ? (
            <View style={styles.webHeaderWrap}>
              <WebMyRecipesHeader onCreate={openCreate} />
            </View>
          ) : (
            <MyRecipesHeader onCreate={openCreate} />
          )}

          {isWebShell ? (
            <View style={styles.webTabsWrap}>
              <WebMyRecipesTabs tabs={tabDefs} active={tab} onChange={setTab} />
            </View>
          ) : (
            <MyRecipesTabs tabs={tabDefs} active={tab} onChange={setTab} />
          )}

          <MyRecipesList
            tab={tab}
            drafts={drafts}
            items={items}
            gridColumns={gridColumns}
            isExpanded={isExpanded}
            isSaved={isSaved}
            onToggleSave={toggleSave}
            onOpenRecipe={openRecipe}
            onOpenDraft={openDraft}
            onDeleteDraft={assistant.requestDraftDelete}
            isFirstLoad={isTabFirstLoad}
            loadFailure={loadFailure}
            onDraftsEndReached={() => void loadMoreDrafts()}
            isLoadingMoreDrafts={
              draftsListState.status === StoreStatus.Loaded && draftsListState.isLoadingMore
            }
            draftsMoreFailure={draftsListState.status === StoreStatus.Loaded ? draftsListState.moreFailure : null}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            scrollable={assistant.scrollable}
          />
        </ResponsiveContainer>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  webHeaderWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  webTabsWrap: {
    paddingHorizontal: spacing.lg,
  },
});

export default MyRecipesScreen;
