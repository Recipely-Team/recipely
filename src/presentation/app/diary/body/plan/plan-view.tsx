import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import { FormBanner } from '@presentation/base/widgets/feedback/form-banner';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { AddToPlanSheet } from '@presentation/base/widgets/meal-plan/add-to-plan-sheet';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { PlanWeekBar } from '@presentation/app/diary/body/plan/plan-week-bar';
import { PlanDayStrip } from '@presentation/app/diary/body/plan/plan-day-strip';
import { PlanDaySection } from '@presentation/app/diary/body/plan/plan-day-section';
import { PlanWeekGrid } from '@presentation/app/diary/body/plan/plan-week-grid';
import { PlanEmptyWeek } from '@presentation/app/diary/body/plan/plan-empty-week';
import { PlanSkeleton } from '@presentation/app/diary/body/plan/plan-skeleton';
import { PlanSignedOut } from '@presentation/app/diary/body/plan/plan-signed-out';
import { PlanShopBar } from '@presentation/app/diary/body/plan/plan-shop-bar';
import { MealActionsSheet } from '@presentation/app/diary/sheets/plan/meal-actions-sheet';
import { MoveMealSheet } from '@presentation/app/diary/sheets/plan/move-meal-sheet';
import { WeekMenuSheet } from '@presentation/app/diary/sheets/plan/week-menu-sheet';
import { PlanShoppingSheet } from '@presentation/app/diary/sheets/plan/plan-shopping-sheet';
import { usePlanSheets } from '@presentation/app/diary/hooks/plan/use-plan-sheets';
import { usePlanEntryActions } from '@presentation/app/diary/hooks/plan/use-plan-entry-actions';
import { usePlanWeekActions } from '@presentation/app/diary/hooks/plan/use-plan-week-actions';
import { PlanViewKind } from '@presentation/app/diary/model/plan/plan-view-kind';
import { PlanSheetKind } from '@presentation/app/diary/model/plan/plan-sheet-kind';
import type { PlanView as PlanViewState } from '@presentation/app/diary/model/plan/plan-view';
import { spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanViewProps {
  view: PlanViewState;
  weekStart: CalendarDate;
  today: CalendarDate;
  selected: CalendarDate;
  isCurrentWeek: boolean;
  goal: number;
  /** An expanded viewport: the 7-column grid instead of the strip and one day. */
  wide: boolean;
  onSelect: (date: CalendarDate) => void;
  onPage: (direction: number) => void;
  onThisWeek: () => void;
  onRetry: () => void;
  /** The tab's own top — the mode switch (and the web title) — scrolled with the week. */
  header: ReactNode;
  isRefreshing: boolean;
  onRefresh: () => void;
  /** The tab's scroll padding, so Plan and Log line up. */
  contentStyle: object;
}

/**
 * The Diary tab's Plan mode (design spec → Meal planner): week bar, then the
 * phone's strip and selected day or the web grid, the "Add week to shopping
 * list" bar, and every Plan sheet. Signed out, loading and failed weeks show
 * their own state; an empty week shows the "Plan your week" card.
 */
export const PlanView = (props: PlanViewProps): React.JSX.Element => {
  const { view, weekStart, today, selected, isCurrentWeek, goal, wide } = props;
  const locale = useLocale();
  const strings = t().mealPlan;
  const sheets = usePlanSheets();
  const entryActions = usePlanEntryActions(today);
  const weekActions = usePlanWeekActions(weekStart);

  const week: MealPlanWeek | null = view.kind === PlanViewKind.Week ? view.week : null;
  const summary =
    week === null || week.isEmpty
      ? null
      : strings.weekSummary.replace('{m}', String(week.mealCount)).replace('{k}', formatWholeNumber(week.averageDailyCalories, locale));
  const firstOpenDay = selected.isBefore(today) ? today : selected;
  const todayIndex = isCurrentWeek ? weekStart.weekDays().findIndex((day) => day.equals(today)) : null;
  const handlers = {
    onAdd: sheets.openAdd,
    onOpen: entryActions.openRecipe,
    onStep: entryActions.stepServings,
    onOptions: sheets.openMealActions,
  };

  const hasShopBar = week !== null && !week.isEmpty;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={props.contentStyle}
        refreshControl={<RefreshControl refreshing={props.isRefreshing} onRefresh={props.onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {props.header}
        {view.kind === PlanViewKind.SignedOut ? (
          <PlanSignedOut />
        ) : (
          <View style={styles.stack}>
            <PlanWeekBar
              weekStart={weekStart}
              isCurrentWeek={isCurrentWeek}
              summary={summary}
              wide={wide}
              onPage={props.onPage}
              onThisWeek={props.onThisWeek}
              onMenu={sheets.openWeekMenu}
            />
            {wide ? null : <PlanDayStrip week={week} days={weekStart.weekDays()} selected={selected} today={today} goal={goal} onSelect={props.onSelect} />}
            {view.kind === PlanViewKind.Loading ? <PlanSkeleton wide={wide} /> : null}
            {view.kind === PlanViewKind.Error ? (
              <View style={styles.stack}>
                <FormBanner message={failureContent(view.failure).body} severity={SeverityType.Danger} />
                <PrimaryButton label={strings.tryAgain} onPress={props.onRetry} />
              </View>
            ) : null}
            {week !== null && week.isEmpty ? (
              <PlanEmptyWeek
                todayIndex={todayIndex === ValueConstants.minusOne ? null : todayIndex}
                onAdd={() => sheets.openAdd(firstOpenDay, null)}
                onCopyLastWeek={weekActions.copyLastWeek}
              />
            ) : null}
            {week !== null && !week.isEmpty ? (
              <>
                {wide ? (
                  <PlanWeekGrid week={week} today={today} goal={goal} {...handlers} />
                ) : (
                  <PlanDaySection week={week} date={selected} today={today} goal={goal} {...handlers} />
                )}
                {wide ? <PlanShopBar wide summary={summary} onPress={sheets.openShopping} /> : null}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
      {hasShopBar && !wide ? <PlanShopBar wide={false} summary={summary} onPress={sheets.openShopping} /> : null}

      <AddToPlanSheet request={sheets.addRequest} onClose={sheets.closeAdd} />
      <MealActionsSheet
        entry={sheets.sheet.kind === PlanSheetKind.MealActions ? sheets.sheet.entry : null}
        today={today}
        onClose={sheets.close}
        onStep={entryActions.stepServings}
        onToggleEaten={entryActions.toggleEaten}
        onMove={sheets.openMove}
        onOpen={entryActions.openRecipe}
        onRemove={entryActions.remove}
      />
      <MoveMealSheet
        key={sheets.sheet.kind === PlanSheetKind.Move ? sheets.sheet.entry.id : PlanSheetKind.None}
        entry={sheets.sheet.kind === PlanSheetKind.Move ? sheets.sheet.entry : null}
        today={today}
        onMove={entryActions.move}
        onClose={sheets.close}
      />
      <WeekMenuSheet
        visible={sheets.sheet.kind === PlanSheetKind.WeekMenu}
        canClear={week !== null && !week.isEmpty}
        onClose={sheets.close}
        onCopyLastWeek={weekActions.copyLastWeek}
        onClearWeek={sheets.openClearWeek}
      />
      <ConfirmSheet
        visible={sheets.sheet.kind === PlanSheetKind.ClearWeek}
        title={strings.clearTitle}
        message={strings.clearBody}
        confirmLabel={strings.clearWeek}
        destructive
        onConfirm={() => {
          sheets.close();
          weekActions.clearWeek();
        }}
        onClose={sheets.close}
      />
      {week === null ? null : <PlanShoppingSheet visible={sheets.sheet.kind === PlanSheetKind.Shopping} week={week} onClose={sheets.close} />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: ValueConstants.one },
  stack: { gap: spacing.md },
});
