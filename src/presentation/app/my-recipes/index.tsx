import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { StyleSheet, View } from 'react-native';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ScreenContainer } from '@presentation/base/widgets/layout/screen-container';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useAssistantConfirmation } from '@presentation/base/hooks/assistant/actions/use-assistant-confirmation';
import { useAssistantMyRecipesActions } from '@presentation/app/my-recipes/hooks/use-assistant-my-recipes-actions';
import { useAssistantListRecipeActions } from '@presentation/base/hooks/assistant/actions/use-assistant-list-recipe-actions';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import { draftName } from '@presentation/app/my-recipes/model/draft-name';
import type { MyRecipesTab } from '@presentation/app/my-recipes/model/my-recipes-tab';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { WebMyRecipesHeader } from '@presentation/app/my-recipes/body/web-my-recipes-header';
import { WebMyRecipesTabs } from '@presentation/app/my-recipes/body/web-my-recipes-tabs';
import { MyRecipesHeader } from '@presentation/app/my-recipes/body/my-recipes-header';
import { MyRecipesTabs } from '@presentation/app/my-recipes/body/my-recipes-tabs';
import { MyRecipesList } from '@presentation/app/my-recipes/body/my-recipes-list';
import { useMyRecipesRefresh } from '@presentation/app/my-recipes/hooks/use-my-recipes-refresh';
import { RECIPE_CARD_MIN_WIDTH, GRID_GAP } from '@presentation/app/my-recipes/model/grid-metrics';
import { parseTabParam } from '@presentation/app/my-recipes/model/parse-tab-param';
import { isFirstLoad } from '@presentation/app/my-recipes/model/is-first-load';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { t } from '@presentation/i18n';
import { RoutePaths } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

const WEB_CONTENT_MAX = WEB_CONTENT_MAX_WIDTH.myRecipes;

/** Stable identity, so the Drafts tab does not hand the hook a new array a render. */
const EMPTY_ROWS: readonly { id: string; name: string }[] = [];

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
  const drafts = draftsStore((s) => s.drafts);
  const draftsListState = draftsStore((s) => s.listState);
  const loadMoreDrafts = draftsStore((s) => s.loadMoreDrafts);

  // Deep-linked tab: a publish lands on created.
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TabType>(() => parseTabParam(params.tab));

  // Re-read ?tab= when it changes: this tab screen stays mounted.
  const lastTabParam = useRef(params.tab);
  useEffect(() => {
    if (params.tab === lastTabParam.current) return;
    lastTabParam.current = params.tab;
    if (params.tab !== undefined) setTab(parseTabParam(params.tab));
  }, [params.tab]);
  const { isRefreshing, onRefresh } = useMyRecipesRefresh(tab);

  const gridColumns = useMemo<number>(() => {
    if (!isExpanded) return ValueConstants.one;
    const available = Math.min(width, WEB_CONTENT_MAX) - spacing.xl * ValueConstants.two;
    return Math.max(ValueConstants.one, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)));
  }, [isExpanded, width]);

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

  const openRecipe = (id: string): void => {
    router.push(RoutePaths.recipeDetail(id) as Href);
  };

  const openCreate = (): void => {
    router.push(RoutePaths.createRecipe);
  };

  const openDraft = (id: string): void => {
    router.push({ pathname: RoutePaths.createRecipe, params: { draftId: id } });
  };

  const deleteDraft = async (id: string): Promise<void> => {
    const result = await draftsStore.getState().deleteDraft(id);
    if (!result.ok) showErrorToast(result.failure);
  };

  // Deleting a draft asks first; the sheet takes a spoken answer.
  const [draftPendingDelete, setDraftPendingDelete] = useState<string | null>(null);
  useAssistantMyRecipesActions({
    tab,
    items,
    drafts,
    onSwitchTab: setTab,
    onOpenRecipe: openRecipe,
    onOpenDraft: openDraft,
    onRequestDeleteDraft: setDraftPendingDelete,
    onRefresh,
    isTabSettled,
  });
  // The tab decides which list a name refers to; Drafts exposes no rows.
  useAssistantListRecipeActions(tab === TabType.Drafts ? EMPTY_ROWS : items);
  // Whichever list branch is on screen is the one the assistant scrolls.
  const scrollable = useAssistantScrollable();
  // Report rows only once the tab has loaded.
  useAssistantScreenContent(() =>
    tab === TabType.Drafts
      ? recipeRoster(TabType.Drafts, drafts.map(draftName), tabListState)
      : recipeRoster(tab, items.map((recipe) => recipe.name), tabListState),
  );
  // The whole tab for readScreen (the screen line above is capped at eight).
  useAssistantScreenReading(() =>
    tab === TabType.Drafts
      ? listReading(TabType.Drafts, drafts.map(draftName), tabListState)
      : listReading(tab, items.map((recipe) => recipe.name), tabListState),
  );
  useAssistantConfirmation(
    draftPendingDelete !== null,
    () => {
      if (draftPendingDelete !== null) void deleteDraft(draftPendingDelete);
      setDraftPendingDelete(null);
    },
    () => setDraftPendingDelete(null),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ConfirmSheet
        visible={draftPendingDelete !== null}
        title={t().assistant.deleteDraftTitle}
        message={t().assistant.deleteDraftMessage}
        confirmLabel={t().myRecipes.deleteRecipe}
        destructive
        onConfirm={() => {
          if (draftPendingDelete !== null) void deleteDraft(draftPendingDelete);
          setDraftPendingDelete(null);
        }}
        onClose={() => setDraftPendingDelete(null)}
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
            onToggleSave={(id) => void toggleSave(id)}
            onOpenRecipe={openRecipe}
            onOpenDraft={openDraft}
            onDeleteDraft={(id) => void deleteDraft(id)}
            isFirstLoad={isTabFirstLoad}
            loadFailure={loadFailure}
            onDraftsEndReached={() => void loadMoreDrafts()}
            isLoadingMoreDrafts={
              draftsListState.status === StoreStatus.Loaded &&
              draftsListState.isLoadingMore === true
            }
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            scrollable={scrollable}
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
