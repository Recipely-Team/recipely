import { FlatList, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import { usePlanRecipePicker } from '@presentation/base/hooks/meal-plan/use-plan-recipe-picker';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { FoodSearchField } from '@presentation/base/widgets/diary/add-food/pick/food-search-field';
import { PickSkeleton } from '@presentation/base/widgets/diary/add-food/pick/pick-skeleton';
import { PickMessage } from '@presentation/base/widgets/diary/add-food/pick/pick-message';
import { PlanPickRow } from '@presentation/base/widgets/meal-plan/plan-pick-row';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { diarySizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanPickStepProps {
  onChoose: (hit: RecipeFoodHit) => void;
}

const emptyCopy = (tab: RecipeHitGroupType, query: string): string => {
  const strings = t().mealPlan;
  if (tab === FoodSearchGroup.Saved) return strings.emptySaved;
  if (tab === FoodSearchGroup.Mine) return strings.emptyMine;
  return strings.emptySearch.replace('{q}', query.trim());
};

/**
 * Add — pick (design spec → Meal planner): Saved / My recipes / Search, then
 * the server's paged list. An empty search lists the top recipes; the list
 * pages on scroll, so the sheet lets it scroll itself.
 */
export const PlanPickStep = ({ onChoose }: PlanPickStepProps): React.JSX.Element => {
  const picker = usePlanRecipePicker();
  const strings = t().mealPlan;
  const tabs = [
    { key: FoodSearchGroup.Saved, label: strings.tabSaved },
    { key: FoodSearchGroup.Mine, label: strings.tabMine },
    { key: FoodSearchGroup.Recipes, label: strings.tabSearch },
  ] as const;
  const { recipes } = picker;

  const body = (): React.JSX.Element => {
    if (recipes.status === StoreStatus.Idle || recipes.status === StoreStatus.Loading) return <PickSkeleton />;
    if (recipes.status === StoreStatus.Error) {
      return <PickMessage title={failureContent(recipes.failure).title} hint={null} action={{ label: strings.tryAgain, icon: 'refresh', onPress: picker.retry }} />;
    }
    if (recipes.items.length === ValueConstants.zero) return <PickMessage title={emptyCopy(picker.tab, picker.query)} hint={null} action={null} />;
    return (
      <FlatList
        data={recipes.items}
        keyExtractor={(hit) => hit.id}
        renderItem={({ item }) => <PlanPickRow hit={item} onPress={onChoose} />}
        onEndReached={recipes.hasMore ? picker.loadMore : undefined}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={diarySizes.pickSkeletonRows * ValueConstants.two}
      />
    );
  };

  return (
    <View style={styles.root}>
      <SegmentedTabs options={tabs} value={picker.tab} onChange={picker.setTab} />
      {picker.tab === FoodSearchGroup.Recipes ? (
        <FoodSearchField value={picker.query} onChangeText={picker.setQuery} placeholder={strings.searchPlaceholder} />
      ) : null}
      <View style={styles.list}>{body()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flexShrink: ValueConstants.one, gap: spacing.md, minHeight: diarySizes.pickBodyMinHeight },
  list: { flexShrink: ValueConstants.one },
});
