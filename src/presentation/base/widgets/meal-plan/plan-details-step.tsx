import { StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Servings } from '@domain/diary/entry/servings';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { ServingsStepper } from '@presentation/base/widgets/diary/add-food/detail/servings-stepper';
import { PlanRecipeRow } from '@presentation/base/widgets/meal-plan/plan-recipe-row';
import { PlanDayPicker } from '@presentation/base/widgets/meal-plan/plan-day-picker';
import { PlanMealPicker } from '@presentation/base/widgets/meal-plan/plan-meal-picker';
import type { PlanRecipeChoice } from '@presentation/base/widgets/meal-plan/model/plan-recipe-choice';
import { formatPerServing } from '@presentation/base/utils/meal-plan/format-per-serving';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface PlanDetailsStepProps {
  recipe: PlanRecipeChoice;
  /** Shows "Change" back to the picker; absent when the recipe came from its page. */
  onChange: (() => void) | null;
  /** The Monday of the week the day picker shows. */
  week: CalendarDate;
  date: CalendarDate;
  today: CalendarDate;
  onSelectDate: (date: CalendarDate) => void;
  onPageWeek: (direction: number) => void;
  meal: MealSlotType;
  onMealChange: (meal: MealSlotType) => void;
  /** Absent for a move, which keeps its servings. */
  servings?: { value: Servings; total: number | null; onIncrement: () => void; onDecrement: () => void };
}

/** Add — details, and Move (design spec → Meal planner): the recipe, the day, the meal and — when adding — the servings. */
export const PlanDetailsStep = (props: PlanDetailsStepProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const { recipe, servings } = props;
  return (
    <View style={styles.stack}>
      <PlanRecipeRow
        name={recipe.name}
        imageUrl={recipe.imageUrl}
        meta={formatPerServing(recipe.caloriesPerServing, locale)}
        {...(props.onChange === null ? {} : { action: { label: strings.change, onPress: props.onChange } })}
      />
      <PlanDayPicker week={props.week} selected={props.date} today={props.today} onSelect={props.onSelectDate} onPage={props.onPageWeek} />
      <View style={styles.group}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.textMuted}>
          {strings.meal}
        </SizedText>
        <PlanMealPicker value={props.meal} onChange={props.onMealChange} />
      </View>
      {servings === undefined ? null : (
        <View style={styles.group}>
          <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.textMuted}>
            {strings.servings}
          </SizedText>
          <ServingsStepper servings={servings.value} onIncrement={servings.onIncrement} onDecrement={servings.onDecrement} />
          {servings.total === null ? null : (
            <SizedText size={fontSizes.caption} color={colors.textMuted} style={styles.center}>
              {strings.totalKcal.replace('{k}', formatWholeNumber(servings.total, locale))}
            </SizedText>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
  group: { gap: spacing.sm },
  center: { textAlign: 'center' },
});
