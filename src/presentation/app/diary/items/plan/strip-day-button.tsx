import { Pressable, StyleSheet } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { KcalBar } from '@presentation/app/diary/items/plan/kcal-bar';
import { formatPlanWeekday } from '@presentation/base/utils/meal-plan/format-plan-weekday';
import { formatPlanDay } from '@presentation/base/utils/meal-plan/format-plan-day';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { borderWidths, fontSizes, fontWeights, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface StripDayButtonProps {
  date: CalendarDate;
  selected: boolean;
  isToday: boolean;
  mealCount: number;
  kcal: number;
  goal: number;
  onPress: () => void;
}

/**
 * One day of the phone's week strip (design spec → Meal planner, Day strip):
 * weekday, date and a kcal bar at 70% width. Selected = `primary` fill with a
 * light track; today (unselected) = 2 px `primary` border and a `primary`
 * weekday. The selected track is `gradientBorder` (white 28%) — the
 * prototype's 35% has no token, and this one already means "translucent on
 * `primary`".
 */
export const StripDayButton = ({ date, selected, isToday, mealCount, kcal, goal, onPress }: StripDayButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const label = [
    strings.dayA11y.replace('{date}', formatPlanDay(date, locale)).replace('{count}', String(mealCount)).replace('{kcal}', formatWholeNumber(kcal, locale)),
    isToday ? strings.today : CharConstants.empty,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.day,
        { backgroundColor: selected ? colors.primary : colors.surface, opacity: pressed ? opacities.pressedSubtle : opacities.full },
        isToday && !selected ? { borderColor: colors.primary, borderWidth: borderWidths.medium } : null,
      ]}
    >
      <SizedText
        size={fontSizes.micro}
        weight={isToday && !selected ? fontWeights.heavy : fontWeights.semibold}
        color={selected ? colors.primaryText : isToday ? colors.primary : colors.textMuted}
      >
        {formatPlanWeekday(date, locale)}
      </SizedText>
      <SizedText size={fontSizes.heading} weight={fontWeights.heavy} color={selected ? colors.primaryText : colors.text}>
        {String(date.day)}
      </SizedText>
      <KcalBar
        planned={kcal}
        goal={goal}
        height={mealPlanSizes.kcalBar}
        width={mealPlanSizes.kcalBarStripWidth}
        inverse={selected ? { track: colors.gradientBorder, fill: colors.primaryText } : undefined}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  day: {
    flex: ValueConstants.one,
    minHeight: mealPlanSizes.stripDay,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
