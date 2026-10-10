import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
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
import { useDiaryMode } from '@presentation/app/diary/hooks/plan/use-diary-mode';
import { useMealPlanWeek } from '@presentation/app/diary/hooks/plan/use-meal-plan-week';
import { DiaryModeSwitch } from '@presentation/app/diary/items/plan/diary-mode-switch';
import { PlanView } from '@presentation/app/diary/body/plan/plan-view';
import { DiaryMode } from '@presentation/app/diary/model/plan/diary-mode';
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
 * - **Plan | Log** (design spec → Meal planner): with the `mealPlanner` flag
 *   on, a switch at the top swaps the day's log for the week's plan, which
 *   scrolls on its own so its shopping bar can stay fixed on a phone.
 */
export const DiaryScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isWebShell, isExpanded, width } = useLayout();
  const vm = useDiaryDay();
  const dayLook = useWeekLooks(vm.selected);
  const sheets = useDiarySheets(vm.selected);
  const isFirstDay = useFirstDay(vm.view.status === StoreStatus.Loaded ? vm.view.day : null);
  const scrollable = useAssistantScrollable();
  useAssistantDiaryActions({ view: vm.view, selected: vm.selected, today: vm.today, select: vm.select, sheets });
  const hasRailBeside = isExpanded && width >= diarySizes.webColumnsMin;
  const mealColumns = isExpanded && width >= diarySizes.webMealColumnsMin ? ValueConstants.two : ValueConstants.one;
  const diaryMode = useDiaryMode();
  const plan = useMealPlanWeek();
  const modeSwitch = diaryMode.canPlan ? <DiaryModeSwitch mode={diaryMode.mode} onChange={diaryMode.setMode} wide={isExpanded} /> : null;
  const contentStyle = isExpanded ? styles.webContent : styles.content;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: isWebShell ? ValueConstants.zero : insets.top }]}>
      <PageTitle subject={t().diary.title} />
      {isWebShell ? null : (
        <DiaryAppBar showCalendar={!isExpanded} onOpenCalendar={() => router.push(RoutePaths.diaryCalendar)} onOpenGoals={sheets.openGoals} />
      )}
      {diaryMode.mode === DiaryMode.Plan ? (
        <PlanView
          view={plan.view}
          weekStart={plan.weekStart}
          today={plan.today}
          selected={plan.selected}
          isCurrentWeek={plan.isCurrentWeek}
          goal={plan.goal}
          isRefreshing={plan.isRefreshing}
          onSelect={plan.select}
          onPage={plan.page}
          wide={isExpanded}
          onRetry={plan.retry}
          onThisWeek={plan.goToThisWeek}
          onRefresh={() => void plan.refresh()}
          contentStyle={contentStyle}
          header={
            <ResponsiveContainer route="diary" gutter={isExpanded}>
              {isWebShell ? <DiaryWebTitle onOpenGoals={sheets.openGoals} /> : null}
              <View style={styles.modeRow}>{modeSwitch}</View>
            </ResponsiveContainer>
          }
        />
      ) : (
        <ScrollView
          {...scrollable}
          contentContainerStyle={contentStyle}
          refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.refresh} />}
          showsVerticalScrollIndicator={false}
        >
          <ResponsiveContainer route="diary" gutter={isExpanded}>
            {isWebShell ? <DiaryWebTitle onOpenGoals={sheets.openGoals} /> : null}
            {modeSwitch === null ? null : <View style={styles.modeRow}>{modeSwitch}</View>}
            <View style={hasRailBeside ? styles.columns : styles.stacked}>
              <View style={styles.main}>
                <View style={isExpanded ? [styles.stripCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }] : null}>
                  <DateStrip selected={vm.selected} today={vm.today} canPageNext={vm.canPageNext} dayLook={dayLook} onSelect={vm.select} onPage={vm.page} />
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
      )}
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
  modeRow: { marginBottom: spacing.md },
  stripCard: {
    ...shadows.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
  },
});

export default DiaryScreen;
