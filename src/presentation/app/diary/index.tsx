import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { AddFoodSheet } from '@presentation/base/widgets/diary/add-food/add-food-sheet';
import { RoutePaths } from '@presentation/base/constants';
import { borderWidths, diarySizes, radii, shadows, spacing } from '@presentation/base/theme';
import { DiaryAppBar } from '@presentation/app/diary/body/diary-app-bar';
import { DiaryWebTitle } from '@presentation/app/diary/body/diary-web-title';
import { DateStrip } from '@presentation/app/diary/body/date-strip';
import { DiaryDayBody } from '@presentation/app/diary/body/diary-day-body';
import { DiaryRail } from '@presentation/app/diary/body/diary-rail';
import { GoalsSheet } from '@presentation/app/diary/sheets/goals-sheet';
import { useDiaryDay } from '@presentation/app/diary/hooks/use-diary-day';
import { useWeekLooks } from '@presentation/app/diary/hooks/use-week-looks';
import { useDiarySheets } from '@presentation/app/diary/hooks/use-diary-sheets';
import { useFirstDay } from '@presentation/app/diary/hooks/use-first-day';
import { useAssistantDiaryActions } from '@presentation/app/diary/hooks/use-assistant-diary-actions';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * The Diary tab's Day view (design spec → Food Diary §4).
 *
 * @remarks
 * - **Two layouts by width, chrome by shell.** An expanded viewport gets the
 *   two-column page with the month calendar in a rail (so no calendar button
 *   and no calendar route); the web shell swaps the native app bar for a page
 *   heading because the site header already carries the bell.
 * - **Signed-out users never reach this screen** — the auth guard sends them
 *   to sign-in with a redirect back, exactly as it does for My Recipes.
 */
export const DiaryScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell, isExpanded, width } = useLayout();
  const { notificationsStore } = useStores();
  const unreadCount = notificationsStore((s) => s.unreadCount);
  const vm = useDiaryDay();
  const dayLook = useWeekLooks(vm.selected);
  const sheets = useDiarySheets(vm.selected);
  const isFirstDay = useFirstDay(vm.view.status === StoreStatus.Loaded ? vm.view.day : null);
  const scrollable = useAssistantScrollable();
  useAssistantDiaryActions({ view: vm.view, selected: vm.selected, today: vm.today, select: vm.select, sheets });
  const hasRailBeside = isExpanded && width >= diarySizes.webColumnsMin;
  const mealColumns = isExpanded && width >= diarySizes.webMealColumnsMin ? ValueConstants.two : ValueConstants.one;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: isWebShell ? ValueConstants.zero : insets.top }]}>
      <PageTitle subject={t().diary.title} />
      {isWebShell ? null : (
        <DiaryAppBar
          showCalendar={!isExpanded}
          unreadCount={unreadCount}
          onOpenCalendar={() => router.push(RoutePaths.diaryCalendar)}
          onOpenGoals={sheets.openGoals}
          onOpenNotifications={() => router.push(RoutePaths.notifications)}
        />
      )}
      <ScrollView
        {...scrollable}
        contentContainerStyle={isExpanded ? styles.webContent : styles.content}
        refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.refresh} />}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer route="diary" gutter={isExpanded}>
          {isWebShell ? <DiaryWebTitle onOpenGoals={sheets.openGoals} /> : null}
          <View style={hasRailBeside ? styles.columns : styles.stacked}>
            <View style={styles.main}>
              <View style={isExpanded ? [styles.stripCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }] : null}>
                <DateStrip
                  selected={vm.selected}
                  today={vm.today}
                  canPageNext={vm.canPageNext}
                  dayLook={dayLook}
                  onSelect={vm.select}
                  onPage={vm.page}
                />
              </View>
              <DiaryDayBody
                view={vm.view}
                isFirstDay={isFirstDay}
                wide={isExpanded}
                mealColumns={mealColumns}
                onAdd={sheets.openAdd}
                onEdit={sheets.openEdit}
                onOpenGoals={sheets.openGoals}
                onWater={vm.setWater}
                onRetry={vm.retry}
              />
            </View>
            {isExpanded ? (
              <View style={hasRailBeside ? styles.rail : null}>
                <DiaryRail selected={vm.selected} today={vm.today} onSelect={vm.select} />
              </View>
            ) : null}
          </View>
        </ResponsiveContainer>
      </ScrollView>
      <AddFoodSheet request={sheets.addRequest} onClose={sheets.closeAdd} />
      <GoalsSheet visible={sheets.goalsOpen} onClose={sheets.closeGoals} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: diarySizes.scrollBottomPad },
  webContent: { paddingTop: diarySizes.webPaddingTop, paddingBottom: diarySizes.webPaddingBottom },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl, marginTop: spacing.lg },
  stacked: { gap: spacing.xl, marginTop: spacing.xs },
  main: { flex: ValueConstants.one, gap: diarySizes.mealGap },
  rail: { width: diarySizes.railWidth },
  stripCard: {
    ...shadows.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
  },
});

export default DiaryScreen;
