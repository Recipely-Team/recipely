import { ActivityIndicator, StyleSheet, View, FlatList } from 'react-native';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
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
  /** Backend results for the current query — `RecipeFilters.search`, not a local filter. */
  recipes: RecipeSummaryEntity[];
  /**
   * True while the query the user has typed has not been answered yet (request
   * in flight, or still inside the debounce window). Must suppress the empty
   * state: `recipes` is the PREVIOUS query's answer until the new one lands, so
   * rendering "no matches" here would accuse a perfectly good query of failing
   * on nearly every keystroke.
   */
  isLoading: boolean;
  onOpenRecipe: (id: string) => void;
  /**
   * Wires the results list to the feed's scroll handle AND its offset. These
   * results REPLACE the browse list, so while they are up they are the page.
   *
   * Both halves, in one object, on purpose: attaching only the handle left
   * "biraz daha aşağı" stepping from an offset that never moved, so it went to
   * the same place every time while reporting a scroll each time.
   */
  assistantScroll: AssistantScrollableProps;
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
  isLoading,
  onOpenRecipe,
  assistantScroll,
}: RecipeSearchOverlayProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <KeyboardAvoider
      style={[styles.panel, { backgroundColor: colors.background }, shadows.md]}
    >
      <View style={styles.countRow}>
        {isLoading ? (
          <View style={styles.countLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <ThemedText variant="caption" muted>
              {t().recipes.refreshing}
            </ThemedText>
          </View>
        ) : (
          <ThemedText variant="caption" muted>
            {recipes.length} {t().recipes.results}
          </ThemedText>
        )}
      </View>
      {isLoading && recipes.length === ValueConstants.zero ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : recipes.length === ValueConstants.zero ? (
        <View style={styles.empty}>
          <Ionicons name="search" size={iconSizes.massive} color={colors.textMuted} />
          <ThemedText variant="body" muted style={styles.emptyTitle}>
            {t().recipes.noResults}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          {...assistantScroll}
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
  countLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
