import { useCallback, useState } from 'react';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { AddToPlanRequest } from '@presentation/base/widgets/meal-plan/model/add-to-plan-request';
import { PlanSheetKind } from '@presentation/app/diary/model/plan/plan-sheet-kind';
import type { PlanSheet } from '@presentation/app/diary/model/plan/plan-sheet';

interface PlanSheets {
  sheet: PlanSheet;
  addRequest: AddToPlanRequest | null;
  openAdd: (date: CalendarDate, meal: MealSlotType | null) => void;
  closeAdd: () => void;
  openMealActions: (entry: MealPlanEntryEntity) => void;
  openMove: (entry: MealPlanEntryEntity) => void;
  openWeekMenu: () => void;
  openClearWeek: () => void;
  openShopping: () => void;
  close: () => void;
}

/** Which Plan sheet is open — one at a time, the add sheet beside them with its own request. */
export const usePlanSheets = (): PlanSheets => {
  const [sheet, setSheet] = useState<PlanSheet>({ kind: PlanSheetKind.None });
  const [addRequest, setAddRequest] = useState<AddToPlanRequest | null>(null);
  return {
    sheet,
    addRequest,
    openAdd: useCallback((date: CalendarDate, meal: MealSlotType | null) => setAddRequest({ recipe: null, date, meal }), []),
    closeAdd: useCallback(() => setAddRequest(null), []),
    openMealActions: useCallback((entry: MealPlanEntryEntity) => setSheet({ kind: PlanSheetKind.MealActions, entry }), []),
    openMove: useCallback((entry: MealPlanEntryEntity) => setSheet({ kind: PlanSheetKind.Move, entry }), []),
    openWeekMenu: useCallback(() => setSheet({ kind: PlanSheetKind.WeekMenu }), []),
    openClearWeek: useCallback(() => setSheet({ kind: PlanSheetKind.ClearWeek }), []),
    openShopping: useCallback(() => setSheet({ kind: PlanSheetKind.Shopping }), []),
    close: useCallback(() => setSheet({ kind: PlanSheetKind.None }), []),
  };
};
