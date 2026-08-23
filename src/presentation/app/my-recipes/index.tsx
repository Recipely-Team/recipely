import { useCallback, useMemo, useState } from 'react';
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
import { recipeRoster } from '@presentation/base/hooks/assistant/args/recipe-roster';
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

  // Deep-linked tab: publishing a recipe lands here on `created`, so the thing
  // the user just made is the thing they are looking at.
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TabType>(() => parseTabParam(params.tab));
  const { isRefreshing, onRefresh } = useMyRecipesRefresh(tab);

  // Grid columns: 1 on a phone, auto-fill at RECIPE_CARD_MIN_WIDTH once the
  // viewport is expanded — the web shell and the iPad alike.
  const gridColumns = useMemo<number>(() => {
    if (!isExpanded) return ValueConstants.one;
    const available = Math.min(width, WEB_CONTENT_MAX) - spacing.xl * ValueConstants.two;
    return Math.max(ValueConstants.one, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)));
  }, [isExpanded, width]);

  // WHY on focus, not on mount: this screen stays mounted behind the create
  // flow, so a mount-only load left a recipe the user had just published (or a
  // draft they had just deleted) missing until a manual pull-to-refresh.
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

  // Each tab owns its own load, so both the skeleton branch and the error
  // branch read the state of the tab actually being shown.
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
  // A failed load must not read as "you have nothing" — that is the same lie
  // the empty-state-while-loading bug told, just with a different cause.
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

  // Deleting a draft is unrecoverable work, so the assistant asks first — and
  // the sheet takes a spoken answer, because the whole point is hands-free.
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
  });
  // The tab is half the answer: "delete the lentil soup" means a different
  // collection on Saved than it does on Created, and the model cannot tell
  // which list it is looking at from the route alone — they share one.
  // Empty on Drafts: `items` falls through to the created recipes there, and a
  // handler answering for rows the user cannot see is how "save that one" ends
  // up saving something else entirely.
  useAssistantListRecipeActions(tab === TabType.Drafts ? EMPTY_ROWS : items);
  useAssistantScreenContent(() =>
    tab === TabType.Drafts
      ? recipeRoster(TabType.Drafts, drafts.map(draftName))
      : recipeRoster(tab, items.map((recipe) => recipe.name)),
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
  // Web band + underlined tabs share the list's horizontal inset so they line
  // up with the recipe grid below; top padding clears the web app header.
  webHeaderWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  webTabsWrap: {
    paddingHorizontal: spacing.lg,
  },
});

export default MyRecipesScreen;
