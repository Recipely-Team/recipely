import { StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PlanRecipeRow } from '@presentation/base/widgets/meal-plan/plan-recipe-row';
import { PlanServingsStepper } from '@presentation/app/diary/items/plan/plan-servings-stepper';
import { PlanActionRow } from '@presentation/app/diary/items/plan/plan-action-row';
import { formatPlanDay } from '@presentation/base/utils/meal-plan/format-plan-day';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { mealPlanSizes, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants } from '@core/constants';

export interface MealActionsSheetProps {
  /** The meal acted on; null closes the sheet. */
  entry: MealPlanEntryEntity | null;
  today: CalendarDate;
  onClose: () => void;
  onStep: (entry: MealPlanEntryEntity, direction: number) => void;
  onToggleEaten: (entry: MealPlanEntryEntity) => void;
  onMove: (entry: MealPlanEntryEntity) => void;
  onOpen: (entry: MealPlanEntryEntity) => void;
  onRemove: (entry: MealPlanEntryEntity) => void;
}

/**
 * A planned meal's options (design spec → Meal planner, Meal actions): the
 * recipe with its slot, day and kcal, the servings stepper (not once eaten),
 * then Mark as eaten / not eaten (only on the day or after — "You can mark it
 * on the day"), Move to another day, Open recipe, Remove.
 */
export const MealActionsSheet = ({ entry, today, onClose, onStep, onToggleEaten, onMove, onOpen, onRemove }: MealActionsSheetProps): React.JSX.Element => {
  const locale = useLocale();
  const strings = t().mealPlan;
  const act = (run: (meal: MealPlanEntryEntity) => void) => (): void => {
    if (entry === null) return;
    onClose();
    run(entry);
  };
  const meta =
    entry === null
      ? CharConstants.empty
      : [planMealLabel(entry.meal), formatPlanDay(entry.date, locale), entry.calories === null ? null : `${formatWholeNumber(entry.calories, locale)} ${strings.kcal}`]
          .filter((part): part is string => part !== null)
          .join(' · ');

  return (
    <BottomSheet visible={entry !== null} title={strings.mealOptions} onClose={onClose}>
      {entry === null ? null : (
        <View style={styles.stack}>
          <PlanRecipeRow name={entry.recipe.name} imageUrl={entry.recipe.imageUrl} meta={meta} thumbSize={mealPlanSizes.actionsThumb} />
          {entry.eaten ? null : <PlanServingsStepper servings={entry.servings.value} onStep={(direction) => onStep(entry, direction)} />}
          <View>
            <PlanActionRow
              icon={entry.eaten ? 'close-circle-outline' : 'checkmark-circle-outline'}
              label={entry.eaten ? strings.markNotEaten : strings.markEaten}
              onPress={act(onToggleEaten)}
              disabledHint={entry.date.isAfter(today) ? strings.markOnTheDay : undefined}
            />
            <PlanActionRow icon="calendar-outline" label={strings.moveToAnotherDay} onPress={act(onMove)} />
            <PlanActionRow icon="book-outline" label={strings.openRecipe} onPress={act(onOpen)} />
            <PlanActionRow icon="trash-outline" label={strings.remove} onPress={act(onRemove)} danger />
          </View>
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});
