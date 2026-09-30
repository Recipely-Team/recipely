import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { ValueConstants } from '@core/constants';
import { diarySizes, spacing } from '@presentation/base/theme';
import { MonthCard } from '@presentation/app/diary/shared/items/month-card';
import { MonthStatsTiles } from '@presentation/app/diary/shared/items/month-stats-tiles';
import { StatusLegend } from '@presentation/app/diary/shared/items/status-legend';
import { useDiaryMonth } from '@presentation/app/diary/shared/hooks/use-diary-month';

export interface DiaryRailProps {
  selected: CalendarDate;
  today: CalendarDate;
  onSelect: (date: CalendarDate) => void;
}

/**
 * The web Day view's right rail (design spec → Food Diary §4 Web): the month
 * calendar, its stats and the legend. Tapping a day updates the left column
 * in place — there is no separate calendar page on this layout.
 */
export const DiaryRail = ({ selected, today, onSelect }: DiaryRailProps): React.JSX.Element => {
  const [month, setMonth] = useState(() => CalendarMonth.of(selected));
  const [followed, setFollowed] = useState(selected);
  // Paging the week strip into another month brings the calendar along.
  if (!selected.equals(followed)) {
    setFollowed(selected);
    if (!CalendarMonth.of(selected).equals(month)) setMonth(CalendarMonth.of(selected));
  }
  const diaryMonth = useDiaryMonth(month);
  return (
    <View style={styles.stack}>
      <MonthCard
        month={month}
        diaryMonth={diaryMonth}
        selected={selected}
        today={today}
        cellHeight={diarySizes.railCell}
        cellGap={diarySizes.railCellGap}
        onSelect={onSelect}
        onPrevious={() => setMonth(month.addMonths(ValueConstants.minusOne))}
        onNext={() => setMonth(month.addMonths(ValueConstants.one))}
      />
      <MonthStatsTiles stats={diaryMonth?.stats(today) ?? null} />
      <StatusLegend />
    </View>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.lg },
});
