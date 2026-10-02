import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants, ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDebouncedValue } from '@presentation/base/hooks/interaction/use-debounced-value';
import { ListConstants } from '@presentation/base/constants/list-constants';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { ADD_FOOD_SEARCH_DEBOUNCE_MS } from '@presentation/base/widgets/diary/add-food/list/search-debounce';
import { RecipeOptionRow } from '@presentation/app/automations/edit/items/recipe-option-row';
import { borderWidths, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';

export interface RecipeStepProps {
  /** Lets the assistant move this step's list. */
  scrollable: AssistantScrollableProps;
  selected: string | null;
  onSelect: (id: string, name: string, image: string | null) => void;
}

/**
 * Step 3 (spec §3): the creator's own recipes (`group=mine` of the food
 * search), searched on the server and paged on scroll; a new search starts
 * from the first page.
 */
export const RecipeStep = ({ selected, onSelect, scrollable }: RecipeStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { automationsStore } = useStores();
  const recipes = automationsStore((s) => s.recipes);
  const [query, setQuery] = useState(CharConstants.empty);
  const debounced = useDebouncedValue(query.trim(), ADD_FOOD_SEARCH_DEBOUNCE_MS);
  const copy = t().instagram;

  useEffect(() => {
    void automationsStore.getState().searchRecipes(debounced);
  }, [automationsStore, debounced]);

  return (
    <FlatList
      {...scrollable}
      data={recipes.status === StoreStatus.Loaded ? recipes.items : []}
      keyExtractor={(hit) => hit.key}
      accessibilityRole="radiogroup"
      renderItem={({ item }) => <RecipeOptionRow hit={item} selected={item.id === selected} onSelect={(hit) => onSelect(hit.id, hit.name, hit.imageUrl)} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <SizedText accessibilityRole="header" size={fontSizes.subtitle} weight={fontWeights.heavy}>
            {copy.recipeTitle}
          </SizedText>
          <SizedText size={fontSizes.caption} color={colors.textSubtle}>
            {copy.recipeBody}
          </SizedText>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={copy.recipeSearch}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={copy.recipeSearch}
            returnKeyType="search"
            style={[styles.search, { color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
          />
        </View>
      }
      ListEmptyComponent={
        recipes.status === StoreStatus.Loading || recipes.status === StoreStatus.Idle ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <SizedText size={fontSizes.medium} muted style={styles.empty}>
            {recipes.status === StoreStatus.Error ? copy.loadFailed : copy.noRecipes}
          </SizedText>
        )
      }
      ListFooterComponent={recipes.status === StoreStatus.Loaded && recipes.isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
      onEndReached={() => void automationsStore.getState().loadMoreRecipes()}
      onEndReachedThreshold={ListConstants.endReachedThreshold}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      style={styles.flex}
    />
  );
};

const styles = StyleSheet.create({
  flex: { flex: ValueConstants.one },
  list: { gap: spacing.xs, paddingBottom: spacing.xl },
  header: { gap: spacing.sm, paddingBottom: spacing.sm },
  search: { minHeight: AutomationMetrics.connectButton, borderRadius: radii.lg, borderWidth: borderWidths.hairline, paddingHorizontal: spacing.md, fontSize: fontSizes.body },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
});
