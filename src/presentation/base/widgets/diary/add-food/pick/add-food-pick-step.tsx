import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import type { MealCandidate } from '@domain/diary/meal/meal-candidate';
import { CharConstants, ValueConstants } from '@core/constants';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { FoodSearchField } from '@presentation/base/widgets/diary/add-food/pick/food-search-field';
import { SearchResultsBody } from '@presentation/base/widgets/diary/add-food/pick/search-results-body';
import { ProductsTabBody } from '@presentation/base/widgets/diary/add-food/pick/products-tab-body';
import { RecentTabBody } from '@presentation/base/widgets/diary/add-food/pick/recent-tab-body';
import { QuickAddFormView } from '@presentation/base/widgets/diary/add-food/pick/quick-add-form-view';
import { PickTab, type PickTabType } from '@presentation/base/widgets/diary/add-food/list/pick-tab';
import { MealLogEntryButton } from '@presentation/base/widgets/diary/add-food/meal/meal-log-entry-button';
import { MealLogBackRow } from '@presentation/base/widgets/diary/add-food/meal/meal-log-back-row';
import { MealLogBody } from '@presentation/base/widgets/diary/add-food/meal/meal-log-body';
import { useMealLog } from '@presentation/base/hooks/diary/use-meal-log';
import { diarySizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AddFoodPickStepProps {
  /** What the search field opens with; a new value replaces what was typed. */
  initialQuery: string;
  /** A description the meal panel opens on and reads at once (the assistant's `logMeal`); null otherwise. */
  initialMealText: string | null;
  meal: MealSlotType;
  isSubmitting: boolean;
  onChoose: (food: LoggableFood) => void;
  onChooseProduct: (product: FoodProduct) => void;
  onChooseRecent: (recent: RecentFoodType) => void;
  onQuickAdd: (food: LoggableFood, meal: MealSlotType) => void;
  onLogMeal: (candidates: readonly MealCandidate[], meal: MealSlotType) => Promise<readonly boolean[]>;
}

/**
 * The Add food sheet's first step (Add food v2 spec §2–§4): a search over
 * the server's recipes and products, and — while the box is empty — the
 * Recipes · Products · Recent · Quick add tabs. Everything listed comes from
 * the backend, page by page.
 *
 * @remarks
 * - **Typing on Quick add leaves it**: the results replace the tabs, and
 *   clearing the box brings back Recipes.
 * - **No results offers Quick add** with the query as the name.
 * - **"Describe or photograph your meal"** is a row above the tabs that opens
 *   the meal panel, which swaps the tabs for a back row; typing a search leaves
 *   it, like Quick add. Its list lives
 *   here, so peeking at another tab does not lose it.
 */
export const AddFoodPickStep = (props: AddFoodPickStepProps): React.JSX.Element => {
  const { initialQuery, initialMealText, meal, isSubmitting } = props;
  const strings = t().diary;
  const [query, setQuery] = useState(initialQuery);
  const [seenQuery, setSeenQuery] = useState(initialQuery);
  const [tab, setTab] = useState<PickTabType>(initialMealText === null ? PickTab.Recipes : PickTab.Meal);
  const [seenMealText, setSeenMealText] = useState(initialMealText);
  const [quickName, setQuickName] = useState(CharConstants.empty);
  const mealLog = useMealLog({ initialText: initialMealText, onLog: props.onLogMeal });
  if (initialQuery !== seenQuery) {
    setSeenQuery(initialQuery);
    setQuery(initialQuery);
  }
  if (initialMealText !== seenMealText) {
    setSeenMealText(initialMealText);
    if (initialMealText !== null) setTab(PickTab.Meal);
  }
  const trimmed = query.trim();
  const isSearching = trimmed.length > ValueConstants.zero;

  const onChangeQuery = (text: string): void => {
    setQuery(text);
    if (text.trim().length > ValueConstants.zero && (tab === PickTab.QuickAdd || tab === PickTab.Meal)) setTab(PickTab.Recipes);
  };

  const body = (): React.JSX.Element => {
    if (isSearching || tab === PickTab.Recipes) {
      return (
        <SearchResultsBody
          rawQuery={isSearching ? query : CharConstants.empty}
          onChoose={props.onChoose}
          onChooseProduct={props.onChooseProduct}
          onQuickAdd={() => {
            setQuickName(trimmed);
            setQuery(CharConstants.empty);
            setTab(PickTab.QuickAdd);
          }}
        />
      );
    }
    switch (tab) {
      case PickTab.Products:
        return <ProductsTabBody onChooseProduct={props.onChooseProduct} />;
      case PickTab.Recent:
        return <RecentTabBody onChooseRecent={props.onChooseRecent} />;
      case PickTab.QuickAdd:
        return <QuickAddFormView key={quickName} initialMeal={meal} initialName={quickName} isSubmitting={isSubmitting} onSubmit={props.onQuickAdd} />;
      case PickTab.Meal:
        return <MealLogBody log={mealLog} meal={meal} isSubmitting={isSubmitting} />;
    }
  };

  return (
    <View style={styles.stack}>
      <FoodSearchField value={query} onChangeText={onChangeQuery} />
      {isSearching || tab === PickTab.Meal ? null : <MealLogEntryButton onPress={() => setTab(PickTab.Meal)} />}
      {!isSearching && tab === PickTab.Meal ? <MealLogBackRow onBack={() => setTab(PickTab.Recipes)} /> : null}
      {isSearching || tab === PickTab.Meal ? null : (
        <SegmentedTabs
          options={[
            { key: PickTab.Recipes, label: strings.tabRecipes },
            { key: PickTab.Products, label: strings.tabProducts },
            { key: PickTab.Recent, label: strings.tabRecent },
            { key: PickTab.QuickAdd, label: strings.tabQuickAdd },
          ]}
          value={tab}
          onChange={setTab}
        />
      )}
      <View style={styles.body}>{body()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md, flexShrink: ValueConstants.one },
  body: { minHeight: diarySizes.pickBodyMinHeight, flexShrink: ValueConstants.one },
});
