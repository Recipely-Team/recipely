import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { diarySizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { dayA11yLabel } from '@presentation/app/diary/shared/model/day-a11y-label';
import { formatWeekdayShort } from '@presentation/app/diary/shared/model/format-weekday-short';
import { useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface DayCellProps {
  date: CalendarDate;
  status: CalorieStatusType;
  calories: number;
  hasEntries: boolean;
  isSelected: boolean;
  isFuture: boolean;
  onPress: (date: CalendarDate) => void;
}

/** One day of the week strip: weekday, day number and a dot when something was logged (design spec → Food Diary §4). */
export const DayCell = ({ date, status, calories, hasEntries, isSelected, isFuture, onPress }: DayCellProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const ink = isSelected ? colors.primaryText : colors.text;
  return (
    <Pressable
      onPress={() => onPress(date)}
      disabled={isFuture}
      accessibilityRole="button"
      accessibilityLabel={dayA11yLabel(date, calories, status, locale)}
      accessibilityState={{ selected: isSelected, disabled: isFuture }}
      style={[
        styles.cell,
        { backgroundColor: isSelected ? colors.primary : colors.surface, opacity: isFuture ? opacities.inactive : opacities.full },
      ]}
    >
      <SizedText size={fontSizes.micro} weight={fontWeights.semibold} color={isSelected ? colors.primaryText : colors.textMuted}>
        {formatWeekdayShort(date, locale)}
      </SizedText>
      <SizedText size={fontSizes.heading} weight={fontWeights.heavy} color={ink}>
        {String(date.day)}
      </SizedText>
      <View style={[styles.dot, hasEntries ? { backgroundColor: isSelected ? colors.primaryText : colors.primary } : null]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    flex: ValueConstants.one,
    minHeight: diarySizes.dayCell,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  dot: {
    width: diarySizes.entryDot,
    height: diarySizes.entryDot,
    borderRadius: radii.round,
  },
});
