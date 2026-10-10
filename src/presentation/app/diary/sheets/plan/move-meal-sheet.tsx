import { useState } from 'react';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { PlanDetailsStep } from '@presentation/base/widgets/meal-plan/plan-details-step';
import { mealPlanSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface MoveMealSheetProps {
  /** The meal to move; null closes the sheet. */
  entry: MealPlanEntryEntity | null;
  today: CalendarDate;
  onMove: (entry: MealPlanEntryEntity, date: CalendarDate, meal: MealSlotType) => void;
  onClose: () => void;
}

/**
 * "Move meal" (design spec → Meal planner, Move): the add sheet's details
 * step without servings — a day (past days disabled) and a meal — and "Move
 * here". Opens on the meal's own day and slot, or today when its day passed.
 * The parent keys it by the meal's id, so each meal starts from its own place.
 */
export const MoveMealSheet = ({ entry, today, onMove, onClose }: MoveMealSheetProps): React.JSX.Element => {
  const strings = t().mealPlan;
  const start = entry === null || entry.date.isBefore(today) ? today : entry.date;
  const [date, setDate] = useState<CalendarDate>(start);
  const [week, setWeek] = useState<CalendarDate>(start.weekStart());
  const [meal, setMeal] = useState<MealSlotType | null>(entry?.meal ?? null);

  return (
    <BottomSheet
      visible={entry !== null}
      title={strings.moveTitle}
      onClose={onClose}
      dialogMaxWidth={mealPlanSizes.addDialogMaxWidth}
      footer={
        entry === null || meal === null ? undefined : (
          <PrimaryButton
            label={strings.moveHere}
            onPress={() => {
              onClose();
              onMove(entry, date, meal);
            }}
          />
        )
      }
    >
      {entry === null || meal === null ? null : (
        <PlanDetailsStep
          recipe={{ id: entry.recipe.id, name: entry.recipe.name, imageUrl: entry.recipe.imageUrl, caloriesPerServing: entry.recipe.caloriesPerServing, meal: null }}
          onChange={null}
          week={week}
          date={date}
          today={today}
          onSelectDate={setDate}
          onPageWeek={(direction) => setWeek(week.addDays(direction * MealPlanLimits.daysPerWeek))}
          meal={meal}
          onMealChange={setMeal}
        />
      )}
    </BottomSheet>
  );
};
