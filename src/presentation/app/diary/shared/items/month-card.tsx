import { StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import type { DiaryMonth } from '@domain/diary/month/diary-month';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, radii, shadows, spacing } from '@presentation/base/theme';
import { MonthCell } from '@presentation/app/diary/shared/items/month-cell';
import { chunkWeeks } from '@presentation/app/diary/shared/model/chunk-weeks';
import { formatMonthYear } from '@presentation/app/diary/shared/model/format-month-year';
import { formatWeekdayShort } from '@presentation/app/diary/shared/model/format-weekday-short';
import { monthGridCells } from '@presentation/app/diary/shared/model/month-grid-cells';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface MonthCardProps {
  month: CalendarMonth;
  /** The loaded month, or undefined while it loads — every day then reads "nothing logged". */
  diaryMonth: DiaryMonth | undefined;
  selected: CalendarDate;
  today: CalendarDate;
  cellHeight: number;
  cellGap: number;
  onSelect: (date: CalendarDate) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * The month calendar: title with paging, a Monday-first weekday row and every
 * day toned by kcal against the goal (design spec → Food Diary §5). Next is
 * disabled once the month holds today.
 */
export const MonthCard = ({ month, diaryMonth, selected, today, cellHeight, cellGap, onSelect, onPrevious, onNext }: MonthCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const rows = chunkWeeks(monthGridCells(month));
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <SizedText accessibilityRole="header" size={fontSizes.heading} weight={fontWeights.heavy} style={styles.title}>
          {formatMonthYear(month, locale)}
        </SizedText>
        <RoundIconButton icon="chevron-back" accessibilityLabel={strings.previousMonth} onPress={onPrevious} size={controlSizes.iconBtn} />
        <RoundIconButton
          icon="chevron-forward"
          accessibilityLabel={strings.nextMonth}
          onPress={onNext}
          size={controlSizes.iconBtn}
          disabled={month.contains(today)}
        />
      </View>
      <View style={[styles.row, { gap: cellGap }]}>
        {month.firstDay.weekDays().map((day) => (
          <SizedText key={day.value} size={fontSizes.micro} weight={fontWeights.semibold} muted style={styles.weekday}>
            {formatWeekdayShort(day, locale)}
          </SizedText>
        ))}
      </View>
      <View style={{ gap: cellGap }}>
        {rows.map((row) => (
          <View key={row.find((cell) => cell !== null)?.value} style={[styles.row, { gap: cellGap }]}>
            {row.map((date, i) =>
              date === null ? (
                <View key={i} style={styles.blank} />
              ) : (
                <MonthCell
                  key={date.value}
                  date={date}
                  status={diaryMonth?.statusFor(date) ?? CalorieStatus.None}
                  calories={diaryMonth?.caloriesOn(date) ?? ValueConstants.zero}
                  isToday={date.equals(today)}
                  isSelected={date.equals(selected)}
                  isFuture={date.isAfter(today)}
                  height={cellHeight}
                  onPress={onSelect}
                />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: ValueConstants.one },
  row: { flexDirection: 'row' },
  weekday: { flex: ValueConstants.one, textAlign: 'center' },
  blank: { flex: ValueConstants.one },
});
