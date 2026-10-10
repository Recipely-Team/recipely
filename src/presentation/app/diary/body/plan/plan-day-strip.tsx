import { StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import { StripDayButton } from '@presentation/app/diary/items/plan/strip-day-button';
import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface PlanDayStripProps {
  /** Null while the week loads or failed: the days still show, without counts. */
  week: MealPlanWeek | null;
  days: readonly CalendarDate[];
  selected: CalendarDate;
  today: CalendarDate;
  goal: number;
  onSelect: (date: CalendarDate) => void;
}

/**
 * The phone's seven-day strip (design spec → Meal planner, Day strip). The
 * prototype's ±40 px swipe between weeks is left out: the ‹ › in the week bar
 * page, and a horizontal swipe here would fight the tab's vertical scroll.
 */
export const PlanDayStrip = ({ week, days, selected, today, goal, onSelect }: PlanDayStripProps): React.JSX.Element => (
  <View style={styles.row} accessibilityRole="tablist">
    {days.map((date) => (
      <StripDayButton
        key={date.value}
        date={date}
        selected={date.equals(selected)}
        isToday={date.equals(today)}
        mealCount={week?.entriesOn(date).length ?? ValueConstants.zero}
        kcal={week?.dayCalories(date) ?? ValueConstants.zero}
        goal={goal}
        onPress={() => onSelect(date)}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs2 },
});
