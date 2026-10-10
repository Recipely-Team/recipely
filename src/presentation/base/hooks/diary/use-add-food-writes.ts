import { useCallback, useState } from 'react';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { showErrorToast, showSuccessToast, showWarningToast } from '@presentation/base/feedback/show-toast';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import { t } from '@presentation/i18n';

/** The Add food sheet's writes, as `useAddFoodWrites` exposes them. */
interface AddFoodWrites {
  isSubmitting: boolean;
  add: (entry: NewFoodLogEntry) => Promise<void>;
  /** Adds one after another; resolves one flag per entry, true when it was saved. */
  addMany: (entries: readonly NewFoodLogEntry[]) => Promise<readonly boolean[]>;
  /** Saves an edit; `null` changes (nothing changed) just closes. */
  update: (changes: FoodLogEntryChanges | null) => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * Add, save and remove through the diary store, with the sheet's outcomes:
 * close and toast on success, keep the sheet open and toast the failure's
 * own copy otherwise (design spec §6). `onOpenDiary` is passed only from
 * outside the diary; the success toast then offers a "Diary" action.
 *
 * @remarks
 * - **`addMany` (the meal panel) saves in order** through the same store
 *   action: all saved closes and toasts the count; a partial save keeps the
 *   sheet open and says how many went in; none saved toasts the failure.
 */
export const useAddFoodWrites = (
  request: AddFoodRequestType | null,
  onClose: () => void,
  onOpenDiary: (() => void) | undefined,
): AddFoodWrites => {
  const { diaryStore } = useStores();
  const [isSubmitting, setSubmitting] = useState(false);

  const logged = useCallback(
    (meal: MealSlotType): void => {
      onClose();
      const message = t().diary.addedToast.replace('{meal}', mealLabel(meal));
      showSuccessToast(message, onOpenDiary === undefined ? undefined : { label: t().diary.toastAction, onRetry: onOpenDiary });
    },
    [onClose, onOpenDiary],
  );

  const add = useCallback(
    async (entry: NewFoodLogEntry): Promise<void> => {
      setSubmitting(true);
      const result = await diaryStore.getState().addEntry(entry);
      setSubmitting(false);
      if (result.ok) logged(entry.meal);
      else showErrorToast(result.failure);
    },
    [diaryStore, logged],
  );

  const addMany = useCallback(
    async (entries: readonly NewFoodLogEntry[]): Promise<readonly boolean[]> => {
      setSubmitting(true);
      const saved: boolean[] = [];
      let failure: Failure | null = null;
      for (const entry of entries) {
        const result = await diaryStore.getState().addEntry(entry);
        saved.push(result.ok);
        if (!result.ok && failure === null) failure = result.failure;
      }
      setSubmitting(false);
      const count = String(saved.filter(Boolean).length);
      const meal = entries[ValueConstants.zero]?.meal;
      if (failure === null && meal !== undefined) {
        onClose();
        const message = t().diary.mealLogAdded.replace('{n}', count).replace('{meal}', mealLabel(meal));
        showSuccessToast(message, onOpenDiary === undefined ? undefined : { label: t().diary.toastAction, onRetry: onOpenDiary });
      } else if (failure !== null && saved.some(Boolean)) {
        showWarningToast(t().diary.mealLogPartial.replace('{n}', count));
      } else if (failure !== null) {
        showErrorToast(failure);
      }
      return saved;
    },
    [diaryStore, onClose, onOpenDiary],
  );

  const update = useCallback(
    async (changes: FoodLogEntryChanges | null): Promise<void> => {
      if (request?.kind !== AddFoodRequestKind.Edit) return;
      if (changes === null) return onClose();
      setSubmitting(true);
      const result = await diaryStore.getState().updateEntry(request.entry, changes);
      setSubmitting(false);
      if (!result.ok) return void showErrorToast(result.failure);
      onClose();
      showSuccessToast(t().diary.updatedToast);
    },
    [diaryStore, onClose, request],
  );

  const remove = useCallback(async (): Promise<void> => {
    if (request?.kind !== AddFoodRequestKind.Edit) return;
    // The store drops the row at once and puts it back if the server refuses.
    onClose();
    const { entry } = request;
    const result = await diaryStore.getState().deleteEntry(entry);
    if (!result.ok) {
      showErrorToast(result.failure);
      return;
    }
    toastStore.getState().show({
      severity: SeverityType.Neutral,
      message: t().diary.removedToast,
      actionLabel: t().common.undo,
      onAction: () => void diaryStore.getState().addEntry(entry.toNew()).then((back) => (back.ok ? undefined : showErrorToast(back.failure))),
    });
  }, [diaryStore, onClose, request]);

  return { isSubmitting, add, addMany, update, remove };
};
