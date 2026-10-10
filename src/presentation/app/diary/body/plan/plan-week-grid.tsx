import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { KcalBar } from '@presentation/app/diary/items/plan/kcal-bar';
import { PlannedMealCard } from '@presentation/app/diary/items/plan/planned-meal-card';
import { formatPlanWeekday } from '@presentation/base/utils/meal-plan/format-plan-weekday';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';
import { borderWidths, fontSizes, fontWeights, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanWeekGridProps {
  week: MealPlanWeek;
  today: CalendarDate;
  goal: number;
  onAdd: (date: CalendarDate, meal: MealSlotType) => void;
  onOpen: (entry: MealPlanEntryEntity) => void;
  onStep: (entry: MealPlanEntryEntity, direction: number) => void;
  onOptions: (entry: MealPlanEntryEntity) => void;
}

const MEALS: readonly MealSlotType[] = Object.values(MealSlot);

/**
 * The web week (design spec → Meal planner, Web grid): a slot-name column and
 * seven day columns (min 128 each, min width 1036 — it scrolls sideways below
 * that). Each column head carries the weekday, date, planned / goal kcal and a
 * bar; today is outlined in `primary` with a "Today" pill. A cell lists its
 * meals and ends in a dashed "+ Add" (filling the cell when it is empty).
 * The prototype's 6% `primary` tint on today's cells has no token; the
 * outlined head marks the column instead.
 */
export const PlanWeekGrid = ({ week, today, goal, onAdd, onOpen, onStep, onOptions }: PlanWeekGridProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const days = week.days;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.headColumn} />
          {days.map((date) => {
            const isToday = date.equals(today);
            const planned = week.dayCalories(date);
            return (
              <View
                key={date.value}
                style={[
                  styles.dayHead,
                  { backgroundColor: colors.surface },
                  isToday ? { borderColor: colors.primary, borderWidth: borderWidths.medium } : null,
                ]}
              >
                <View style={styles.dayHeadTop}>
                  <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.textMuted} style={styles.upper}>
                    {formatPlanWeekday(date, locale)}
                  </SizedText>
                  {isToday ? (
                    <View style={[styles.todayPill, { backgroundColor: colors.primary }]}>
                      <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={colors.primaryText}>
                        {strings.today}
                      </SizedText>
                    </View>
                  ) : null}
                </View>
                <SizedText size={mealPlanSizes.gridDate} weight={fontWeights.heavy}>
                  {String(date.day)}
                </SizedText>
                <SizedText size={fontSizes.small} color={colors.textMuted} numberOfLines={ValueConstants.one}>
                  {`${formatWholeNumber(planned, locale)} / ${formatWholeNumber(goal, locale)}`}
                </SizedText>
                <KcalBar planned={planned} goal={goal} height={mealPlanSizes.kcalBar} />
              </View>
            );
          })}
        </View>
        {MEALS.map((meal) => (
          <View key={meal} style={styles.row}>
            <View style={styles.headColumn}>
              <SizedText size={fontSizes.caption} weight={fontWeights.bold}>
                {planMealLabel(meal)}
              </SizedText>
            </View>
            {days.map((date) => {
              const entries = week.entriesOn(date, meal);
              const canAdd = week.canPlanOn(date, today) && !week.isDayFull(date);
              const isEmpty = entries.length === ValueConstants.zero;
              return (
                <View key={date.value} style={[styles.cell, { backgroundColor: colors.surface, opacity: week.canPlanOn(date, today) ? opacities.full : opacities.disabledFaint }]}>
                  {entries.map((entry) => (
                    <PlannedMealCard
                      key={entry.id}
                      entry={entry}
                      onOpen={() => onOpen(entry)}
                      onStep={(direction) => onStep(entry, direction)}
                      onOptions={() => onOptions(entry)}
                    />
                  ))}
                  {canAdd ? (
                    <Pressable
                      onPress={() => onAdd(date, meal)}
                      accessibilityRole="button"
                      accessibilityLabel={strings.addTo.replace('{slot}', planMealLabel(meal))}
                      style={({ pressed }) => [
                        styles.add,
                        isEmpty ? styles.addFill : null,
                        { borderColor: colors.border, opacity: pressed ? opacities.pressedSubtle : opacities.full },
                      ]}
                    >
                      <SizedText size={fontSizes.small} weight={fontWeights.bold} color={colors.textMuted}>
                        {`+ ${strings.add}`}
                      </SizedText>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: ValueConstants.one },
  grid: { flex: ValueConstants.one, minWidth: mealPlanSizes.gridMinWidth, gap: mealPlanSizes.gridGap },
  row: { flexDirection: 'row', gap: mealPlanSizes.gridGap },
  headColumn: { width: mealPlanSizes.gridHeadColumn, justifyContent: 'center' },
  dayHead: {
    flex: ValueConstants.one,
    minWidth: mealPlanSizes.gridColumnMin,
    borderRadius: radii.lg,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xxs,
  },
  dayHeadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upper: { textTransform: 'uppercase' },
  todayPill: { paddingHorizontal: spacing.xs2, borderRadius: radii.round },
  cell: {
    flex: ValueConstants.one,
    minWidth: mealPlanSizes.gridColumnMin,
    minHeight: mealPlanSizes.gridCellMin,
    borderRadius: radii.lg,
    padding: spacing.xs2,
    gap: spacing.xs2,
  },
  add: {
    minHeight: mealPlanSizes.gridAdd,
    marginTop: 'auto',
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFill: { flex: ValueConstants.one },
});
