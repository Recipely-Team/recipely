import { Pressable, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, diarySizes, fontSizes, fontWeights, opacities, radii, spacing } from '@presentation/base/theme';
import { DayCell } from '@presentation/app/diary/items/day-cell';
import { formatLongDate } from '@presentation/app/diary/model/format-long-date';
import { useHorizontalSwipe } from '@presentation/base/hooks/interaction/use-horizontal-swipe';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

import type { DayLook } from '@presentation/app/diary/model/day-look';

export interface DateStripProps {
  selected: CalendarDate;
  today: CalendarDate;
  canPageNext: boolean;
  /** A day's kcal and status for its cell and spoken label. */
  dayLook: (date: CalendarDate) => DayLook;
  onSelect: (date: CalendarDate) => void;
  /** −1 for the previous week, +1 for the next. */
  onPage: (direction: number) => void;
}

/**
 * The selected day's week, Monday first (design spec → Food Diary §4): the
 * long date with Today, week paging, and seven cells. Future days are inert;
 * the strip pages no further than the current week.
 */
export const DateStrip = ({ selected, today, canPageNext, dayLook, onSelect, onPage }: DateStripProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().diary;
  const swipe = useHorizontalSwipe(onPage, diarySizes.swipeThreshold);
  const isToday = selected.equals(today);
  return (
    <View style={styles.stack}>
      <View style={styles.header}>
        <SizedText size={fontSizes.body} weight={fontWeights.bold} style={styles.date} numberOfLines={ValueConstants.one}>
          {formatLongDate(selected, locale)}
        </SizedText>
        {isToday ? (
          <View style={[styles.todayPill, { backgroundColor: colors.chipBackground }]}>
            <SizedText size={fontSizes.small} weight={fontWeights.bold} color={colors.chipText}>
              {strings.today}
            </SizedText>
          </View>
        ) : (
          <Pressable
            onPress={() => onSelect(today)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.todayGhost, { borderColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
          >
            <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.primary}>
              {strings.today}
            </SizedText>
          </Pressable>
        )}
        <RoundIconButton icon="chevron-back" accessibilityLabel={strings.previousWeek} onPress={() => onPage(ValueConstants.minusOne)} size={controlSizes.iconBtn} />
        <RoundIconButton
          icon="chevron-forward"
          accessibilityLabel={strings.nextWeek}
          onPress={() => onPage(ValueConstants.one)}
          size={controlSizes.iconBtn}
          disabled={!canPageNext}
        />
      </View>
      <View style={styles.grid} {...swipe}>
        {selected.weekDays().map((date) => {
          const { calories, status } = dayLook(date);
          return (
            <DayCell
              key={date.value}
              date={date}
              status={status}
              calories={calories}
              hasEntries={status !== CalorieStatus.None}
              isSelected={date.equals(selected)}
              isFuture={date.isAfter(today)}
              onPress={onSelect}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { flex: ValueConstants.one },
  todayPill: {
    minHeight: diarySizes.todayPill,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.round,
    justifyContent: 'center',
  },
  todayGhost: {
    minHeight: controlSizes.iconBtnSm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', gap: diarySizes.dayCellGap },
});
