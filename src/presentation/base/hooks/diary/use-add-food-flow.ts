import { useCallback, useState } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { Servings } from '@domain/diary/entry/servings';
import { MealSlot } from '@domain/diary/meal-slot';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAddFoodWrites } from '@presentation/base/hooks/diary/use-add-food-writes';
import { useProductStep } from '@presentation/base/hooks/diary/use-product-step';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import type { AddFoodFlow } from '@presentation/base/widgets/diary/add-food/state/add-food-flow';
import type { AddFoodState } from '@presentation/base/widgets/diary/add-food/state/add-food-state';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { ProductChoiceKind } from '@presentation/base/widgets/diary/add-food/state/product/product-choice-kind';
import { initialAddFoodState } from '@presentation/base/widgets/diary/add-food/state/initial-add-food-state';

/** The state before the sheet was ever opened; nothing renders from it. */
const CLOSED: AddFoodState = { date: CalendarDate.today(), meal: MealSlot.Breakfast, canGoBack: false, step: AddFoodStep.Pick };

/**
 * The Add food sheet's state machine: pick → a recipe's servings or a
 * product's variant and amount, the meal, and the add / save / remove writes.
 *
 * @remarks
 * - **Reset while rendering, not in an effect.** A new request replaces the
 *   state in the same render it arrives in, so the sheet never paints one
 *   frame of the previous food. A `null` request (the sheet closing) keeps the
 *   state, so the exit animation still shows what was on screen.
 * - **A listed product is fetched by the catalogue store**; the step reads
 *   it through `useProductStep`, so a late answer for another row never shows.
 * - **Steppers use functional updates**: two quick taps in one render both count.
 */
export const useAddFoodFlow = (request: AddFoodRequest | null, onClose: () => void, onOpenDiary: (() => void) | undefined): AddFoodFlow => {
  const { foodCatalogStore } = useStores();
  const [state, setState] = useState<AddFoodState | null>(() => (request === null ? null : initialAddFoodState(request, new Date())));
  const [seen, setSeen] = useState(request);
  if (request !== seen) {
    setSeen(request);
    if (request !== null) setState(initialAddFoodState(request, new Date()));
  }
  const writes = useAddFoodWrites(request, onClose, onOpenDiary);
  const product = useProductStep(state);
  const ready = product?.status === StoreStatus.Loaded ? product : null;
  const current = state ?? CLOSED;
  const update = useCallback((change: (s: AddFoodState) => AddFoodState) => setState((s) => (s === null ? s : change(s))), []);
  // A stored quantity in another unit than the one shown (the variant changed) is stale: step what is on screen.
  const amount = (change: 'increment' | 'decrement') =>
    update((s) => {
      if (s.step !== AddFoodStep.Product || ready === null) return s;
      const current = s.quantity !== null && s.quantity.unit.key === ready.quantity.unit.key ? s.quantity : ready.quantity;
      return { ...s, quantity: current[change]() };
    });
  const servings = (change: 'increment' | 'decrement') =>
    update((s) => (s.step === AddFoodStep.Detail ? { ...s, servings: s.servings[change]() } : s));

  const submit = async (): Promise<void> => {
    const isEdit = request?.kind === AddFoodRequestKind.Edit;
    if (current.step === AddFoodStep.Detail) {
      if (isEdit) return writes.update(request.entry.changesTo(current.servings.value, current.meal));
      return writes.add(current.food.entryFor(current.date, current.meal, current.servings));
    }
    if (current.step !== AddFoodStep.Product || ready === null) return;
    if (isEdit) return writes.update(request.entry.changesTo(ready.quantity.value, current.meal));
    return writes.add(ready.product.entryFor(current.date, current.meal, ready.quantity));
  };

  return {
    date: current.date,
    step: current.step,
    meal: current.meal,
    isEdit: request?.kind === AddFoodRequestKind.Edit,
    canGoBack: current.canGoBack,
    isSubmitting: writes.isSubmitting,
    food: current.step === AddFoodStep.Detail ? current.food : null,
    servings: current.step === AddFoodStep.Detail ? current.servings : Servings.one(),
    product,
    footerCalories:
      current.step === AddFoodStep.Detail
        ? current.food.nutrientsFor(current.servings).calories
        : ready === null
          ? null
          : ready.product.nutrientsFor(ready.quantity).calories,
    choose: (food) => update((s) => ({ date: s.date, meal: s.meal, canGoBack: true, step: AddFoodStep.Detail, food, servings: Servings.one() })),
    chooseProduct: (row) => {
      void foodCatalogStore.getState().openProduct(row);
      const choice = { kind: ProductChoiceKind.Listed, row } as const;
      update((s) => ({ date: s.date, meal: s.meal, canGoBack: true, step: AddFoodStep.Product, choice, variantIndex: null, quantity: null }));
    },
    chooseRecent: (recent) => {
      if (recent.kind === RecentFoodKind.Food) {
        update((s) => ({ date: s.date, meal: s.meal, canGoBack: true, step: AddFoodStep.Detail, food: recent.food, servings: Servings.one() }));
        return;
      }
      const choice = { kind: ProductChoiceKind.Logged, product: recent.product, quantity: recent.quantity } as const;
      update((s) => ({ date: s.date, meal: s.meal, canGoBack: true, step: AddFoodStep.Product, choice, variantIndex: null, quantity: null }));
    },
    back: () => {
      foodCatalogStore.getState().closeProduct();
      update((s) => ({ date: s.date, meal: s.meal, canGoBack: false, step: AddFoodStep.Pick }));
    },
    increment: () => servings('increment'),
    decrement: () => servings('decrement'),
    setMeal: (meal) => update((s) => ({ ...s, meal })),
    setVariant: (index) =>
      update((s) => {
        if (s.step !== AddFoodStep.Product) return s;
        const keeps = s.quantity !== null && (ready?.variants[index]?.unitKeys.includes(s.quantity.unit.key) ?? false);
        return { ...s, variantIndex: index, quantity: keeps ? s.quantity : null };
      }),
    setUnit: (unit) =>
      update((s) => (s.step === AddFoodStep.Product && ready !== null ? { ...s, quantity: ready.quantity.inUnit(unit) } : s)),
    incrementAmount: () => amount('increment'),
    decrementAmount: () => amount('decrement'),
    retryProduct: () => {
      if (current.step === AddFoodStep.Product && current.choice.kind === ProductChoiceKind.Listed) {
        void foodCatalogStore.getState().openProduct(current.choice.row);
      }
    },
    submit,
    submitQuickAdd: (food, meal) => writes.add(food.entryFor(current.date, meal, Servings.one())),
    remove: writes.remove,
  };
};
