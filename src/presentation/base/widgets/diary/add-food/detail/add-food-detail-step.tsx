import { StyleSheet, View } from 'react-native';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { Servings } from '@domain/diary/entry/servings';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { MealPicker } from '@presentation/base/widgets/diary/add-food/meal-picker';
import { NutrientTotalBox } from '@presentation/base/widgets/diary/add-food/detail/nutrient-total-box';
import { ServingsStepper } from '@presentation/base/widgets/diary/add-food/detail/servings-stepper';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatDayMonth } from '@presentation/base/utils/diary/format-day-month';
import { controlSizes, diarySizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface AddFoodDetailStepProps {
  food: LoggableFood;
  date: CalendarDate;
  servings: Servings;
  meal: MealSlotType;
  canGoBack: boolean;
  onBack: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onMealChange: (meal: MealSlotType) => void;
}

/** The Add food sheet's second step: what the chosen amount adds up to, how much, and to which meal. */
export const AddFoodDetailStep = (props: AddFoodDetailStepProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().diary;
  const { food, date } = props;
  const dayParts = [formatDayMonth(date, locale), ...(date.equals(CalendarDate.today()) ? [strings.today] : [])];
  const meta = [strings.perServingMeta.replace('{k}', formatWholeNumber(food.perServing.calories, locale)), ...dayParts].join(
    CharConstants.middotSpaced,
  );

  return (
    <View style={styles.stack}>
      <View style={styles.header}>
        {props.canGoBack ? (
          <RoundIconButton icon="chevron-back" accessibilityLabel={t().common.back} onPress={props.onBack} size={controlSizes.iconBtn} />
        ) : null}
        <FoodThumb imageUrl={food.imageUrl} isQuickAdd={food.isQuickAdd} size={diarySizes.foodThumbLarge} />
        <View style={styles.headerText}>
          <SizedText size={fontSizes.heading} weight={fontWeights.bold} numberOfLines={ValueConstants.two}>
            {food.name}
          </SizedText>
          <SizedText size={fontSizes.small} muted>
            {meta}
          </SizedText>
        </View>
      </View>
      <NutrientTotalBox nutrients={food.nutrientsFor(props.servings)} />
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {strings.servings}
      </SizedText>
      <ServingsStepper servings={props.servings} onIncrement={props.onIncrement} onDecrement={props.onDecrement} />
      <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
        {strings.meal}
      </SizedText>
      <MealPicker value={props.meal} onChange={props.onMealChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: ValueConstants.one, gap: spacing.xxs },
});
