import { useCallback, useState } from 'react';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import type { UseDiarySheetsResult } from '@presentation/app/diary/model/use-diary-sheets-result';

/** The Day view's two sheets — Add food (add or edit) and Daily goals. New foods go to the selected day. */
export const useDiarySheets = (selected: CalendarDate): UseDiarySheetsResult => {
  const [addRequest, setAddRequest] = useState<AddFoodRequestType | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  return {
    addRequest,
    goalsOpen,
    openAdd: useCallback((meal: MealSlotType | null) => setAddRequest({ kind: AddFoodRequestKind.Pick, date: selected, meal }), [selected]),
    openSearch: useCallback(
      (query: string) => setAddRequest({ kind: AddFoodRequestKind.Pick, date: selected, meal: null, query }),
      [selected],
    ),
    openEdit: useCallback((entry: FoodLogEntryEntity) => setAddRequest({ kind: AddFoodRequestKind.Edit, entry }), []),
    closeAdd: useCallback(() => setAddRequest(null), []),
    openGoals: useCallback(() => setGoalsOpen(true), []),
    closeGoals: useCallback(() => setGoalsOpen(false), []),
  };
};
