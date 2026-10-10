import { StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { KcalBar } from '@presentation/app/diary/items/plan/kcal-bar';
import { PlanSlotCard } from '@presentation/app/diary/body/plan/plan-slot-card';
import { formatPlanDay } from '@presentation/base/utils/meal-plan/format-plan-day';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { borderWidths, fontSizes, fontWeights, mealPlanSizes, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanDaySectionProps {
  week: MealPlanWeek;
  date: CalendarDate;
  today: CalendarDate;
  goal: number;
  onAdd: (date: CalendarDate, meal: MealSlotType) => void;
  onOpen: (entry: MealPlanEntryEntity) => void;
  onStep: (entry: MealPlanEntryEntity, direction: number) => void;
  onOptions: (entry: MealPlanEntryEntity) => void;
}

const MEALS: readonly MealSlotType[] = Object.values(MealSlot);

/**
 * The phone's selected day (design spec → Meal planner, Day head card + Slot
 * cards): the long date with "1,850 / 2,000 kcal planned" and a 6 px bar
 * ("N kcal over your goal" past it), then the four meal slots.
 */
export const PlanDaySection = ({ week, date, today, goal, onAdd, onOpen, onStep, onOptions }: PlanDaySectionProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tones = useDiaryTones();
  const locale = useLocale();
  const strings = t().mealPlan;
  const planned = week.dayCalories(date);
  const over = goal > ValueConstants.zero && planned > goal;
  const canAdd = week.canPlanOn(date, today) && !week.isDayFull(date);
  return (
    <View style={styles.stack}>
      <View style={[styles.head, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <SizedText size={mealPlanSizes.dayHeadValue} weight={fontWeights.bold} accessibilityRole="header">
          {formatPlanDay(date, locale)}
        </SizedText>
        <SizedText size={fontSizes.caption} color={colors.textMuted}>
          {strings.dayPlanned.replace('{x}', formatWholeNumber(planned, locale)).replace('{goal}', formatWholeNumber(goal, locale))}
        </SizedText>
        <KcalBar planned={planned} goal={goal} height={mealPlanSizes.kcalBarHead} />
        {over ? (
          <SizedText size={mealPlanSizes.overText} weight={fontWeights.bold} color={tones.over.solid}>
            {strings.overGoal.replace('{n}', formatWholeNumber(planned - goal, locale))}
          </SizedText>
        ) : null}
      </View>
      {MEALS.map((meal) => (
        <PlanSlotCard
          key={meal}
          meal={meal}
          entries={week.entriesOn(date, meal)}
          kcal={week.slotCalories(date, meal)}
          canAdd={canAdd}
          onAdd={() => onAdd(date, meal)}
          onOpen={onOpen}
          onStep={onStep}
          onOptions={onOptions}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  head: { gap: spacing.xs, paddingTop: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderRadius: radii.xl, borderWidth: borderWidths.hairline },
});
