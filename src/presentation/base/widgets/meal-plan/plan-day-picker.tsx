import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWeekRange } from '@presentation/base/utils/meal-plan/format-week-range';
import { formatPlanWeekday } from '@presentation/base/utils/meal-plan/format-plan-weekday';
import { formatPlanDay } from '@presentation/base/utils/meal-plan/format-plan-day';
import { borderWidths, controlSizes, fontSizes, fontWeights, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanDayPickerProps {
  /** The Monday of the week shown. */
  week: CalendarDate;
  selected: CalendarDate;
  today: CalendarDate;
  onSelect: (date: CalendarDate) => void;
  /** −1 for the previous week, +1 for the next. */
  onPage: (direction: number) => void;
}

/**
 * "Day" with the week's range and paging, then the seven days as buttons
 * (design spec → Meal planner, Add — details): a day that has passed is
 * disabled at 40%, today is outlined, the chosen day is filled `primary`.
 */
export const PlanDayPicker = ({ week, selected, today, onSelect, onPage }: PlanDayPickerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const canPageBack = !week.isBefore(today.weekStart()) && !week.equals(today.weekStart());
  return (
    <View style={styles.stack}>
      <View style={styles.header}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.textMuted} style={styles.label}>
          {strings.day}
        </SizedText>
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold} color={colors.textMuted}>
          {formatWeekRange(week, locale)}
        </SizedText>
        <RoundIconButton icon="chevron-back" accessibilityLabel={strings.previousWeek} onPress={() => onPage(ValueConstants.minusOne)} size={controlSizes.iconBtnSm} padToTouchTarget disabled={!canPageBack} />
        <RoundIconButton icon="chevron-forward" accessibilityLabel={strings.nextWeek} onPress={() => onPage(ValueConstants.one)} size={controlSizes.iconBtnSm} padToTouchTarget />
      </View>
      <View style={styles.row}>
        {week.weekDays().map((date) => {
          const isPast = date.isBefore(today);
          const isSelected = date.equals(selected);
          const isToday = date.equals(today);
          const ink = isSelected ? colors.primaryText : colors.text;
          return (
            <Pressable
              key={date.value}
              onPress={() => onSelect(date)}
              disabled={isPast}
              accessibilityRole="button"
              accessibilityLabel={formatPlanDay(date, locale)}
              accessibilityState={{ selected: isSelected, disabled: isPast }}
              style={[
                styles.day,
                { backgroundColor: isSelected ? colors.primary : colors.surface, opacity: isPast ? opacities.inactive : opacities.full },
                isToday && !isSelected ? { borderColor: colors.primary, borderWidth: borderWidths.medium } : null,
              ]}
            >
              <SizedText size={fontSizes.micro} weight={fontWeights.semibold} color={isSelected ? colors.primaryText : colors.textMuted}>
                {formatPlanWeekday(date, locale)}
              </SizedText>
              <SizedText size={fontSizes.heading} weight={fontWeights.heavy} color={ink}>
                {String(date.day)}
              </SizedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { flex: ValueConstants.one },
  row: { flexDirection: 'row', gap: spacing.xs2 },
  day: {
    flex: ValueConstants.one,
    minHeight: mealPlanSizes.dayButton,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
