import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';
import { DraftCard } from '@presentation/app/my-recipes/items/draft-card';
import { WebRecipeCard } from '@presentation/base/widgets/cards/web-recipe-card';
import type { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { GRID_GAP } from '@presentation/app/my-recipes/model/grid-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';

type DraftItem = React.ComponentProps<typeof DraftCard>['draft'];

export interface MyRecipesListProps {
  tab: TabType;
  drafts: readonly DraftItem[];
  items: readonly RecipeSummaryEntity[];
  gridColumns: number;
  isWebShell: boolean;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onOpenRecipe: (id: string) => void;
  onOpenDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
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
 */
export const MyRecipesList = ({
  tab,
  drafts,
  items,
  gridColumns,
  isWebShell,
  isSaved,
  onToggleSave,
  onOpenRecipe,
  onOpenDraft,
  onDeleteDraft,
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

  if (tab === 'drafts') {
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
            name={tab === 'saved' ? 'bookmark-outline' : 'silverware-fork-knife'}
            size={iconSizes.jumbo}
            color={colors.textMuted}
          />
          <ThemedText variant="body" muted style={styles.emptyText}>
            {tab === 'saved' ? t().myRecipes.emptySaved : t().myRecipes.emptyCreated}
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
          {isWebShell ? (
            <WebRecipeCard
              recipe={item}
              saved={isSaved(item.id)}
              onOpen={onOpenRecipe}
              onToggleSave={onToggleSave}
              ownedByMe={tab === 'created'}
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
