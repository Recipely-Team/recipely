import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { CharConstants, ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useRecipeFoodSources } from '@presentation/base/hooks/diary/use-recipe-food-sources';
import { useRecipeFoodLoader } from '@presentation/base/hooks/diary/use-recipe-food-loader';
import { SuffixField } from '@presentation/base/widgets/diary/suffix-field';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { PickListHeading } from '@presentation/base/widgets/diary/add-food/pick/pick-list-heading';
import { RecipeFoodRows } from '@presentation/base/widgets/diary/add-food/pick/recipe-food-rows';
import { RecentFoodRows } from '@presentation/base/widgets/diary/add-food/pick/recent-food-rows';
import { QuickAddFormView } from '@presentation/base/widgets/diary/add-food/pick/quick-add-form-view';
import { buildRecipeFoodGroups } from '@presentation/base/widgets/diary/add-food/search/build-recipe-food-groups';
import { matchesFoodQuery } from '@presentation/base/widgets/diary/add-food/search/matches-food-query';
import { FoodSourceTab, type FoodSourceTabType } from '@presentation/base/widgets/diary/add-food/search/food-source-tab';
import { fontSizes, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface AddFoodPickStepProps {
  meal: MealSlotType;
  isSubmitting: boolean;
  onChoose: (food: LoggableFood) => void;
  onQuickAdd: (food: LoggableFood, meal: MealSlotType) => void;
}

/**
 * The Add food sheet's first step: search, then Recipes · Recent · Quick add
 * (design spec → Food Diary §6). Typing replaces the tabs with one "Results"
 * list over recipes and recent foods alike.
 */
export const AddFoodPickStep = ({ meal, isSubmitting, onChoose, onQuickAdd }: AddFoodPickStepProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  const { diaryStore } = useStores();
  const recent = diaryStore((s) => s.recent);
  const sources = useRecipeFoodSources();
  const loader = useRecipeFoodLoader();
  const [query, setQuery] = useState(CharConstants.empty);
  const [tab, setTab] = useState<FoodSourceTabType>(FoodSourceTab.Recipes);

  useEffect(() => {
    void diaryStore.getState().loadRecent();
  }, [diaryStore]);

  const groups = useMemo(() => buildRecipeFoodGroups(sources, query, locale), [sources, query, locale]);
  const isSearching = query.trim().length > ValueConstants.zero;
  const recentMatches = recent.filter((food) => matchesFoodQuery(food.name, query, locale));
  const recipeMatches = groups.flatMap((group) => group.recipes);

  const empty = (message: string): React.JSX.Element => (
    <SizedText size={fontSizes.medium} muted style={styles.empty}>
      {message}
    </SizedText>
  );

  const body = (): React.JSX.Element => {
    if (isSearching) {
      if (recipeMatches.length + recentMatches.length === ValueConstants.zero) return empty(strings.noResults);
      return (
        <>
          <PickListHeading title={strings.results} />
          <RecipeFoodRows recipes={recipeMatches} loader={loader} onChoose={onChoose} />
          <RecentFoodRows foods={recentMatches} onChoose={onChoose} />
        </>
      );
    }
    switch (tab) {
      case FoodSourceTab.Recipes:
        if (groups.length === ValueConstants.zero) return empty(strings.recipesEmpty);
        return (
          <>
            {groups.map((group) => (
              <View key={group.key}>
                <PickListHeading title={group.title} />
                <RecipeFoodRows recipes={group.recipes} loader={loader} onChoose={onChoose} />
              </View>
            ))}
          </>
        );
      case FoodSourceTab.Recent:
        return recent.length === ValueConstants.zero ? empty(strings.recentEmpty) : <RecentFoodRows foods={recent} onChoose={onChoose} />;
      case FoodSourceTab.QuickAdd:
        return <QuickAddFormView initialMeal={meal} isSubmitting={isSubmitting} onSubmit={onQuickAdd} />;
    }
  };

  return (
    <View style={styles.stack}>
      <SuffixField value={query} onChangeText={setQuery} accessibilityLabel={strings.searchPlaceholder} placeholder={strings.searchPlaceholder} />
      {isSearching ? null : (
        <SegmentedTabs
          options={[
            { key: FoodSourceTab.Recipes, label: strings.tabRecipes },
            { key: FoodSourceTab.Recent, label: strings.tabRecent },
            { key: FoodSourceTab.QuickAdd, label: strings.tabQuickAdd },
          ]}
          value={tab}
          onChange={setTab}
        />
      )}
      <View>{body()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  empty: { paddingVertical: spacing.xl, textAlign: 'center' },
});
