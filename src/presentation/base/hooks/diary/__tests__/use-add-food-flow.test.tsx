import { act } from 'react-test-renderer';
import { ok, fail } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { MealSlot } from '@domain/diary/meal-slot';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { useAddFoodFlow } from '@presentation/base/hooks/diary/use-add-food-flow';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import type { AddFoodFlow } from '@presentation/base/widgets/diary/add-food/state/add-food-flow';

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const date = CalendarDate.of(2026, 9, 29);
const food = LoggableFood.of({ name: 'Menemen', perServing: nutrientsOf({ calories: 300, protein: 20 }), recipeId: 'r1', imageUrl: null });

const setup = (request: AddFoodRequest, onOpenDiary?: () => void) => {
  const actions = {
    addEntry: jest.fn().mockResolvedValue(ok(foodLogEntryOf())),
    updateEntry: jest.fn().mockResolvedValue(ok(foodLogEntryOf())),
    deleteEntry: jest.fn().mockResolvedValue(ok(undefined)),
  };
  const diaryStore = { getState: () => actions };
  const onClose = jest.fn();
  const flow: { current: AddFoodFlow | null } = { current: null };
  const Probe = (): null => {
    flow.current = useAddFoodFlow(request, onClose, onOpenDiary);
    return null;
  };
  renderComponent(<Probe />, { diaryStore } as unknown as Partial<Stores>);
  const get = (): AddFoodFlow => {
    if (flow.current === null) throw new Error('not rendered');
    return flow.current;
  };
  return { actions, onClose, get };
};

describe('useAddFoodFlow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs the chosen amount to the request’s day and meal, then closes with a "Diary" action', async () => {
    const openDiary = jest.fn();
    const { actions, onClose, get } = setup({ kind: AddFoodRequestKind.Food, date, meal: MealSlot.Dinner, food }, openDiary);
    act(() => get().increment());
    await act(async () => get().submit());
    const entry = actions.addEntry.mock.calls[0][0];
    expect(entry.date.value).toBe('2026-09-29');
    expect(entry.meal).toBe(MealSlot.Dinner);
    expect(entry.servings).toBe(1.5);
    expect(entry.nutrients.calories).toBe(450);
    expect(onClose).toHaveBeenCalled();
    expect(showSuccessToast).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ onRetry: openDiary }));
  });

  it('stays open and shows the failure when the add is refused', async () => {
    const { actions, onClose, get } = setup({ kind: AddFoodRequestKind.Food, date, meal: null, food });
    const failure = new NetworkFailure('offline');
    actions.addEntry.mockResolvedValueOnce(fail(failure));
    await act(async () => get().submit());
    expect(onClose).not.toHaveBeenCalled();
    expect(showErrorToast).toHaveBeenCalledWith(failure);
  });

  it('closes an untouched edit without a request, and sends only what changed', async () => {
    const entry = foodLogEntryOf({ servings: 1, meal: MealSlot.Lunch });
    const first = setup({ kind: AddFoodRequestKind.Edit, entry });
    await act(async () => first.get().submit());
    expect(first.actions.updateEntry).not.toHaveBeenCalled();
    expect(first.onClose).toHaveBeenCalled();

    const second = setup({ kind: AddFoodRequestKind.Edit, entry });
    act(() => second.get().setMeal(MealSlot.Snacks));
    await act(async () => second.get().submit());
    expect(second.actions.updateEntry).toHaveBeenCalledWith(entry, { meal: MealSlot.Snacks });
  });

  it('removes an edited entry', async () => {
    const entry = foodLogEntryOf();
    const { actions, onClose, get } = setup({ kind: AddFoodRequestKind.Edit, entry });
    await act(async () => get().remove());
    expect(onClose).toHaveBeenCalled();
    expect(actions.deleteEntry).toHaveBeenCalledWith(entry);
  });
});
