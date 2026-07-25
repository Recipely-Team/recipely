import { StyleSheet, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeListItem } from '@presentation/app/recipes/items/cards/recipe-list-item';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';

export interface RecipeSearchOverlayProps {
  /** Already name-filtered recipes for the current query (see `recipe-list-screen`'s `filteredRecipes`). */
  recipes: RecipeSummaryEntity[];
  onOpenRecipe: (id: string) => void;
}

const ItemSeparator = (): React.JSX.Element => <View style={styles.separator} />;

/**
 * Mobile-only dedicated search-results surface (`recipe-list-screen`'s
 * `isSearching` body branch). Replaces the normal browse body — AI banner,
 * cuisine strip, and their scroll-past-to-see-results problem — with just the
 * result count and a results list that renders immediately below the sticky
 * search bar. `KeyboardAvoider` keeps the last visible row clear of the
 * software keyboard so results are never hidden underneath it.
 */
export const RecipeSearchOverlay = ({
  recipes,
  onOpenRecipe,
}: RecipeSearchOverlayProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <KeyboardAvoider
      style={[styles.panel, { backgroundColor: colors.background }, shadows.md]}
    >
      <View style={styles.countRow}>
        <ThemedText variant="caption" muted>
          {recipes.length} {t().recipes.results}
        </ThemedText>
      </View>
      {recipes.length === ValueConstants.zero ? (
        <View style={styles.empty}>
          <Ionicons name="search" size={iconSizes.massive} color={colors.textMuted} />
          <ThemedText variant="body" muted style={styles.emptyTitle}>
            {t().recipes.noResults}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <RecipeListItem recipe={item} onPress={() => onOpenRecipe(item.id)} />
          )}
          ItemSeparatorComponent={ItemSeparator}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
        />
      )}
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  panel: {
    flex: ValueConstants.one,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listContent: {
    flexGrow: ValueConstants.one,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.md,
  },
  empty: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    textAlign: 'center',
  },
});
