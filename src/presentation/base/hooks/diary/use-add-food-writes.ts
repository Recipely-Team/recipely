import { useCallback, useState } from 'react';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { FoodLogEntryChanges } from '@domain/diary/entry/food-log-entry-changes';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import { t } from '@presentation/i18n';

/** The Add food sheet's writes, as `useAddFoodWrites` exposes them. */
interface AddFoodWrites {
  isSubmitting: boolean;
  add: (entry: NewFoodLogEntry) => Promise<void>;
  /** Saves an edit; `null` changes (nothing changed) just closes. */
  update: (changes: FoodLogEntryChanges | null) => Promise<void>;
  remove: () => Promise<void>;
}

/**
 * Add, save and remove through the diary store, with the sheet's outcomes:
 * close and toast on success, keep the sheet open and toast the failure's
 * own copy otherwise (design spec §6). `onOpenDiary` is passed only from
 * outside the diary; the success toast then offers a "Diary" action.
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
    const result = await diaryStore.getState().deleteEntry(request.entry);
    if (result.ok) showSuccessToast(t().diary.removedToast);
    else showErrorToast(result.failure);
  }, [diaryStore, onClose, request]);

  return { isSubmitting, add, update, remove };
};
