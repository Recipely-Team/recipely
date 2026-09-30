import { useCallback, useState } from 'react';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import { Servings } from '@domain/diary/entry/servings';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import type { AddFoodFlow } from '@presentation/base/widgets/diary/add-food/state/add-food-flow';
import type { AddFoodState } from '@presentation/base/widgets/diary/add-food/state/add-food-state';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { initialAddFoodState } from '@presentation/base/widgets/diary/add-food/state/initial-add-food-state';
import { t } from '@presentation/i18n';

/**
 * The Add food sheet's state machine: pick → detail, the stepper, the meal,
 * and the add / save / remove writes.
 *
 * @remarks
 * - **Reset while rendering, not in an effect.** A new request replaces the
 *   state in the same render it arrives in, so the sheet never paints one
 *   frame of the previous food. A `null` request (the sheet closing) keeps the
 *   state, so the exit animation still shows what was on screen.
 * - **Outcomes are toasts** (design spec §6): the sheet closes on success, and
 *   a failure keeps it open with the failure's own copy.
 * - `onOpenDiary` is passed only from outside the diary; the success toast
 *   then offers a "Diary" action.
 */
export const useAddFoodFlow = (
  request: AddFoodRequest | null,
  onClose: () => void,
  onOpenDiary: (() => void) | undefined,
): AddFoodFlow => {
  const { diaryStore } = useStores();
  const [state, setState] = useState<AddFoodState | null>(() => (request === null ? null : initialAddFoodState(request, new Date())));
  const [seen, setSeen] = useState(request);
  const [isSubmitting, setSubmitting] = useState(false);
  if (request !== seen) {
    setSeen(request);
    if (request !== null) setState(initialAddFoodState(request, new Date()));
  }

  const patch = useCallback((next: Partial<AddFoodState>) => setState((s) => (s === null ? s : { ...s, ...next })), []);

  const logged = useCallback(
    (meal: MealSlotType): void => {
      onClose();
      const message = t().diary.addedToast.replace('{meal}', mealLabel(meal));
      showSuccessToast(message, onOpenDiary === undefined ? undefined : { label: t().diary.toastAction, onRetry: onOpenDiary });
    },
    [onClose, onOpenDiary],
  );

  const add = useCallback(
    async (food: LoggableFood, meal: MealSlotType, servings: Servings): Promise<void> => {
      if (state === null) return;
      setSubmitting(true);
      const result = await diaryStore.getState().addEntry(food.entryFor(state.date, meal, servings));
      setSubmitting(false);
      if (result.ok) logged(meal);
      else showErrorToast(result.failure);
    },
    [diaryStore, logged, state],
  );

  const submit = useCallback(async (): Promise<void> => {
    if (request === null || state === null || state.food === null) return;
    if (request.kind !== AddFoodRequestKind.Edit) return add(state.food, state.meal, state.servings);
    const changes = request.entry.changesTo(state.servings.value, state.meal);
    if (changes === null) return onClose();
    setSubmitting(true);
    const result = await diaryStore.getState().updateEntry(request.entry, changes);
    setSubmitting(false);
    if (!result.ok) return void showErrorToast(result.failure);
    onClose();
    showSuccessToast(t().diary.updatedToast);
  }, [add, diaryStore, onClose, request, state]);

  const remove = useCallback(async (): Promise<void> => {
    if (request?.kind !== AddFoodRequestKind.Edit) return;
    // The store drops the row at once and puts it back if the server refuses.
    onClose();
    const result = await diaryStore.getState().deleteEntry(request.entry);
    if (result.ok) showSuccessToast(t().diary.removedToast);
    else showErrorToast(result.failure);
  }, [diaryStore, onClose, request]);

  // Null only before the sheet was ever opened; nothing renders from it then.
  const current = state ?? { date: CalendarDate.today(), step: AddFoodStep.Pick, food: null, servings: Servings.one(), meal: MealSlot.Breakfast, canGoBack: false };
  return {
    ...current,
    isEdit: request?.kind === AddFoodRequestKind.Edit,
    isSubmitting,
    choose: (food) => patch({ step: AddFoodStep.Detail, food, servings: Servings.one(), canGoBack: true }),
    back: () => patch({ step: AddFoodStep.Pick, food: null, canGoBack: false }),
    // Functional updates: two quick taps inside one render must both count.
    increment: () => setState((s) => (s === null ? s : { ...s, servings: s.servings.increment() })),
    decrement: () => setState((s) => (s === null ? s : { ...s, servings: s.servings.decrement() })),
    setMeal: (meal) => patch({ meal }),
    submit,
    submitQuickAdd: (food, meal) => add(food, meal, Servings.one()),
    remove,
  };
};
