import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import { FoodPickRow } from '@presentation/base/widgets/diary/add-food/pick/food-pick-row';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { t, useLocale } from '@presentation/i18n';

export interface RecentFoodRowsProps {
  foods: readonly LoggableFood[];
  onChoose: (food: LoggableFood) => void;
}

/**
 * Recently logged foods. The backend returns each as one serving with no date
 * or last amount, so the row reads "460 kcal · per serving" and picking it
 * starts the stepper at 1 serving.
 */
export const RecentFoodRows = ({ foods, onChoose }: RecentFoodRowsProps): React.JSX.Element => {
  const locale = useLocale();
  return (
    <>
      {foods.map((food) => (
        <FoodPickRow
          key={`${food.recipeId}:${food.name}`}
          name={food.name}
          meta={t().diary.perServingMeta.replace('{k}', formatWholeNumber(food.perServing.calories, locale))}
          imageUrl={food.imageUrl}
          isQuickAdd={food.isQuickAdd}
          isLoading={false}
          onPress={() => onChoose(food)}
        />
      ))}
    </>
  );
};
