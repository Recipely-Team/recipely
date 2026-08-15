import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ListConstants } from '@presentation/base/constants';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { DraftCard } from '@presentation/app/my-recipes/items/draft-card';
import { MyRecipesSkeleton } from '@presentation/app/my-recipes/body/my-recipes-skeleton';
import { WebRecipeCard } from '@presentation/base/widgets/cards/web-recipe-card';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
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
import { ValueConstants } from '@core/constants';

type DraftItem = React.ComponentProps<typeof DraftCard>['draft'];

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
}: MyRecipesListProps): React.JSX.Element => {
  const colors = useTheme().colors;
  // `tintColor` is iOS-only and `colors` is Android-only; both are needed for the
  // spinner to follow the theme on each platform.
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

  // Only when there is nothing to fall back on: a failed RELOAD leaves the rows
  // the user was already reading exactly where they are.
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
          style={styles.list}
          contentContainerStyle={styles.emptyContent}
          refreshControl={refreshControl}
        >
          <View style={styles.empty}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={iconSizes.jumbo} color={colors.textMuted} />
            <ThemedText variant="body" muted style={styles.emptyText}>
              {t().drafts.empty}
            </ThemedText>
          </View>
        </ScrollView>
      );
    }
    return (
      <FlatList
        refreshControl={refreshControl}
        data={drafts}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <DraftCard
            draft={item}
            onOpen={() => onOpenDraft(item.id)}
            onDelete={() => onDeleteDraft(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
        style={styles.list}
        contentContainerStyle={styles.emptyContent}
        refreshControl={refreshControl}
      >
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name={tab === TabType.Saved ? 'bookmark-outline' : 'silverware-fork-knife'}
            size={iconSizes.jumbo}
            color={colors.textMuted}
          />
          <ThemedText variant="body" muted style={styles.emptyText}>
            {tab === TabType.Saved ? t().myRecipes.emptySaved : t().myRecipes.emptyCreated}
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      refreshControl={refreshControl}
      key={`grid-${gridColumns}`}
      data={items as RecipeSummaryEntity[]}
      keyExtractor={(r) => r.id}
      numColumns={gridColumns}
      renderItem={({ item }) => (
        <View style={gridColumns > ValueConstants.one ? styles.gridCell : null}>
          {isExpanded ? (
            <WebRecipeCard
              recipe={item}
              saved={isSaved(item.id)}
              onOpen={onOpenRecipe}
              onToggleSave={onToggleSave}
              ownedByMe={tab === TabType.Created}
            />
          ) : (
            <RecipeCard
              name={item.name}
              image={item.image}
              cuisine={item.cuisine}
              difficulty={item.difficulty}
              rating={item.rating}
              onPress={() => onOpenRecipe(item.id)}
            />
          )}
        </View>
      )}
      columnWrapperStyle={gridColumns > ValueConstants.one ? styles.gridRow : undefined}
      ItemSeparatorComponent={gridColumns === ValueConstants.one ? () => <View style={styles.separator} /> : undefined}
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
  gridCell: {
    flex: ValueConstants.one,
  },
  // flexGrow keeps the empty state pullable: the scroll content must fill the
  // viewport so the gesture has a surface even with almost nothing rendered.
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
