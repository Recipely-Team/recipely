import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { RoundIconButton } from '@presentation/base/widgets/buttons/round-icon-button';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { controlSizes, diarySizes, spacing } from '@presentation/base/theme';
import { MonthCard } from '@presentation/app/diary/shared/items/month-card';
import { MonthStatsTiles } from '@presentation/app/diary/shared/items/month-stats-tiles';
import { StatusLegend } from '@presentation/app/diary/shared/items/status-legend';
import { useDiaryMonth } from '@presentation/app/diary/shared/hooks/use-diary-month';
import { RoutePaths } from '@presentation/base/constants';
import { t } from '@presentation/i18n';

/**
 * The phone's month page (design spec → Food Diary §5): stats, the month card
 * and the legend. Tapping a day selects it and returns to the Day view.
 */
export const DiaryCalendarView = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { diaryStore } = useStores();
  const selected = diaryStore((s) => s.selectedDate);
  const [month, setMonth] = useState(() => CalendarMonth.of(selected));
  const diaryMonth = useDiaryMonth(month);
  const scrollable = useAssistantScrollable();
  const today = CalendarDate.today();
  const strings = t().diary;

  // Opened cold (a link, a reload on the web) there is nothing to go back to; the Day view is where this page lives.
  const leave = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace(RoutePaths.diary);
  };

  const pick = (date: CalendarDate): void => {
    void diaryStore.getState().selectDate(date);
    leave();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <RoundIconButton icon="chevron-back" accessibilityLabel={t().common.back} onPress={leave} size={controlSizes.floatingBtn} />
        <ThemedText variant="title" accessibilityRole="header">
          {strings.calendarTitle}
        </ThemedText>
      </View>
      <ScrollView {...scrollable} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthStatsTiles stats={diaryMonth?.stats(today) ?? null} />
        <MonthCard
          month={month}
          diaryMonth={diaryMonth}
          selected={selected}
          today={today}
          cellHeight={diarySizes.monthCell}
          cellGap={diarySizes.dayCellGap}
          onSelect={pick}
          onPrevious={() => setMonth(month.addMonths(ValueConstants.minusOne))}
          onNext={() => setMonth(month.addMonths(ValueConstants.one))}
        />
        <StatusLegend />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: diarySizes.scrollBottomPad },
});
