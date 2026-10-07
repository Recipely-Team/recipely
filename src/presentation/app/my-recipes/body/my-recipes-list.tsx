import { useCallback } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ListConstants } from '@presentation/base/constants';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { DraftCard } from '@presentation/app/my-recipes/items/draft-card';
import { MyRecipesSkeleton } from '@presentation/app/my-recipes/body/my-recipes-skeleton';
import { MyRecipeCell } from '@presentation/app/my-recipes/items/my-recipe-cell';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { TabIcons } from '@presentation/app/my-recipes/model/tab-icons';
import { GRID_GAP } from '@presentation/app/my-recipes/model/grid-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes } from '@presentation/base/theme';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import {
  failureContent,
  failureIcon,
  failureSeverity,
} from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';
import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { ValueConstants } from '@core/constants';

type DraftItem = React.ComponentProps<typeof DraftCard>['draft'];

// Module-level so their identity is stable: an inline separator remounts on every render.
const Separator = (): React.JSX.Element => <View style={styles.separator} />;
const idKey = (row: { id: string }): string => row.id;

/**
 * What each tab says when it has nothing. Read lazily: `t()` resolves against
 * the active locale, so a module-level lookup would freeze the copy at the
 * language the app started in.
 */
const EMPTY_COPY: Record<TabType, () => string> = {
  [TabType.Saved]: () => t().myRecipes.emptySaved,
  [TabType.Liked]: () => t().myRecipes.emptyLiked,
  [TabType.Created]: () => t().myRecipes.emptyCreated,
  [TabType.Drafts]: () => t().drafts.empty,
};

export interface MyRecipesListProps {
  tab: TabType;
  drafts: readonly DraftItem[];
  items: readonly RecipeSummaryEntity[];
  gridColumns: number;
  isExpanded: boolean;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onOpenRecipe: (id: string) => void;
  onOpenDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  /**
   * True while the active tab is loading its FIRST page — the skeleton branch.
   * Distinct from `isRefreshing`, which reloads a list that is already on screen.
   */
  isFirstLoad: boolean;
  /** Why the active tab's load failed, or null. Rendered instead of the empty state. */
  loadFailure: Failure | null;
  /** Asks for the next page of drafts; the list pages like the recipe feed does. */
  onDraftsEndReached: () => void;
  isLoadingMoreDrafts: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  /**
   * Spread onto whichever branch renders, so "aşağı kaydır" moves the list the
   * user is actually looking at rather than the one that happens to be first.
   */
  scrollable: AssistantScrollableProps;
}

/**
 * Renders the active My-Recipes tab body: the drafts list, an empty state, or
 * the saved/created recipe grid (single column on mobile, multi-column on web).
 *
 * Every branch is pull-to-refreshable — the empty states are wrapped in a
 * scroll view because a plain `View` accepts no pull gesture, and an empty tab
 * is exactly when a user reaches for one.
 *
 * The skeleton branch comes FIRST: an unanswered tab is not an empty one, and
 * rendering "you have saved nothing yet" while the request was still in flight
 * is what made every cold open flash an empty screen before filling in.
 *
 * Rows are memoised and get only the screen's stable id handlers (`FlatList`
 * calls `renderItem` for every visible cell on each render, so a fresh arrow
 * per row re-rendered them all); both lists are windowed with `ListConstants`.
 */
export const MyRecipesList = ({
  tab,
  drafts,
  items,
  gridColumns,
  isExpanded,
  isSaved,
  onToggleSave,
  onOpenRecipe,
  onOpenDraft,
  onDeleteDraft,
  isFirstLoad,
  loadFailure,
  onDraftsEndReached,
  isLoadingMoreDrafts,
  isRefreshing,
  onRefresh,
  scrollable,
}: MyRecipesListProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const renderDraft = useCallback(
    ({ item }: { item: DraftItem }): React.JSX.Element => (
      <DraftCard draft={item} onOpen={onOpenDraft} onDelete={onDeleteDraft} />
    ),
    [onOpenDraft, onDeleteDraft],
  );
  const renderRecipe = useCallback(
    ({ item }: { item: RecipeSummaryEntity }): React.JSX.Element => (
      <MyRecipeCell
        recipe={item}
        gridColumns={gridColumns}
        isExpanded={isExpanded}
        saved={isSaved(item.id)}
        ownedByMe={tab === TabType.Created}
        onOpen={onOpenRecipe}
        onToggleSave={onToggleSave}
      />
    ),
    [gridColumns, isExpanded, isSaved, onOpenRecipe, onToggleSave, tab],
  );
  // tintColor (iOS) and colors (Android) both theme the spinner.
  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={colors.textMuted}
      colors={[colors.primary]}
    />
  );

  if (isFirstLoad) {
    return <MyRecipesSkeleton tab={tab} gridColumns={gridColumns} />;
  }

  // Only with nothing to fall back on; a failed reload keeps the rows.
  if (loadFailure !== null && (tab === TabType.Drafts ? drafts.length : items.length) === ValueConstants.zero) {
    const content = failureContent(loadFailure);
    return (
      <ErrorState
        severity={failureSeverity(loadFailure)}
        icon={failureIcon(loadFailure)}
        title={content.title}
        body={content.body}
        primaryLabel={t().errors.retry}
        onPrimary={onRefresh}
      />
    );
  }

  if (tab === TabType.Drafts) {
    if (drafts.length === ValueConstants.zero) {
      return (
        <ScrollView
          {...scrollable}
          style={styles.list}
          contentContainerStyle={styles.emptyContent}
          refreshControl={refreshControl}
        >
          <View style={styles.empty}>
            <MaterialCommunityIcons name={TabIcons[TabType.Drafts]} size={iconSizes.jumbo} color={colors.textMuted} />
            <ThemedText variant="body" muted style={styles.emptyText}>
              {EMPTY_COPY[TabType.Drafts]()}
            </ThemedText>
          </View>
        </ScrollView>
      );
    }
    return (
      <FlatList
        {...scrollable}
        refreshControl={refreshControl}
        data={drafts}
        keyExtractor={idKey}
        renderItem={renderDraft}
        ItemSeparatorComponent={Separator}
        initialNumToRender={ListConstants.initialRows}
        maxToRenderPerBatch={ListConstants.rowsPerBatch}
        windowSize={ListConstants.windowSize}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        onEndReached={onDraftsEndReached}
        onEndReachedThreshold={ListConstants.endReachedThreshold}
        ListFooterComponent={<FeedFooter isLoadingMore={isLoadingMoreDrafts} />}
      />
    );
  }

  if (items.length === ValueConstants.zero) {
    return (
      <ScrollView
        {...scrollable}
        style={styles.list}
        contentContainerStyle={styles.emptyContent}
        refreshControl={refreshControl}
      >
        <View style={styles.empty}>
          <MaterialCommunityIcons name={TabIcons[tab]} size={iconSizes.jumbo} color={colors.textMuted} />
          <ThemedText variant="body" muted style={styles.emptyText}>
            {EMPTY_COPY[tab]()}
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      {...scrollable}
      refreshControl={refreshControl}
      key={`grid-${gridColumns}`}
      data={items as RecipeSummaryEntity[]}
      keyExtractor={idKey}
      numColumns={gridColumns}
      renderItem={renderRecipe}
      initialNumToRender={ListConstants.initialRows}
      maxToRenderPerBatch={ListConstants.rowsPerBatch}
      windowSize={ListConstants.windowSize}
      columnWrapperStyle={gridColumns > ValueConstants.one ? styles.gridRow : undefined}
      ItemSeparatorComponent={gridColumns === ValueConstants.one ? Separator : undefined}
      contentContainerStyle={[styles.listContent, gridColumns > ValueConstants.one ? styles.gridContent : null]}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  list: {
    flex: ValueConstants.one,
  },
  separator: {
    height: spacing.md,
  },
  gridRow: {
    gap: GRID_GAP,
    paddingHorizontal: spacing.lg,
  },
  gridContent: {
    paddingHorizontal: ValueConstants.zero,
    paddingTop: spacing.md,
    gap: GRID_GAP,
  },
  // flexGrow keeps the empty state pullable.
  emptyContent: {
    flexGrow: ValueConstants.one,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
});
