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
import { StoreStatus } from '@application/store/store-status';
import { configureFoodCatalogStore } from '@application/diary/foods/food-catalog-store';
import { ListFoodCategoriesUseCase } from '@application/diary/foods/browse/list-food-categories-use-case';
import { ListFoodProductsUseCase } from '@application/diary/foods/browse/list-food-products-use-case';
import { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import { LoadFoodDetailUseCase } from '@application/diary/foods/detail/load-food-detail-use-case';
import { fakeFoodCatalogRepository, productOf } from '@application/diary/foods/__fixtures__/food-fixtures';
import { FoodDetail } from '@domain/diary/foods/product/food-detail';

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const date = CalendarDate.of(2026, 9, 29);
const food = LoggableFood.of({ name: 'Menemen', perServing: nutrientsOf({ calories: 300, protein: 20 }), recipeId: 'r1', imageUrl: null });

/** Ayran with two variants, a glass of 200 ml, per 100 ml: 38 / 26 kcal. */
const ayranDetail = () =>
  FoodDetail.create({
    source: 'curated', foodId: 'f1', offBarcode: null, kind: 'drink', category: 'dairy', name: 'Ayran', brand: null, packSize: null,
    unit: 'ml', imageUrl: null,
    variants: [
      { foodVariantId: 'v1', name: 'Klasik', per100: nutrientsOf({ calories: 38, protein: 1.7 }), servingUnits: [{ key: 'glass', amount: 200 }] },
      { foodVariantId: 'v2', name: 'Az yağlı', per100: nutrientsOf({ calories: 26, protein: 1.5 }), servingUnits: [{ key: 'glass', amount: 200 }] },
    ],
  });

const setup = (request: AddFoodRequest, onOpenDiary?: () => void) => {
  const actions = {
    addEntry: jest.fn().mockResolvedValue(ok(foodLogEntryOf())),
    updateEntry: jest.fn().mockResolvedValue(ok(foodLogEntryOf())),
    deleteEntry: jest.fn().mockResolvedValue(ok(undefined)),
  };
  const diaryStore = { getState: () => actions };
  const repo = fakeFoodCatalogRepository();
  repo.getProduct.mockResolvedValue(ayranDetail());
  const foodCatalogStore = configureFoodCatalogStore({
    listCategories: new ListFoodCategoriesUseCase(repo),
    listProducts: new ListFoodProductsUseCase(repo),
    listRecent: new ListRecentFoodPageUseCase(repo),
    loadDetail: new LoadFoodDetailUseCase(repo),
  });
  const onClose = jest.fn();
  const flow: { current: AddFoodFlow | null } = { current: null };
  const Probe = (): null => {
    flow.current = useAddFoodFlow(request, onClose, onOpenDiary);
    return null;
  };
  renderComponent(<Probe />, { diaryStore, foodCatalogStore } as unknown as Partial<Stores>);
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

  it('counts every stepper tap, even two inside one render', () => {
    const { get } = setup({ kind: AddFoodRequestKind.Food, date, meal: null, food });
    const flow = get();
    act(() => {
      flow.increment();
      flow.increment();
    });
    expect(get().servings.value).toBe(2);
  });

  it('logs a listed product: its variants load, one glass by default, totals for the amount, with the product reference', async () => {
    const { actions, get } = setup({ kind: AddFoodRequestKind.Pick, date, meal: MealSlot.Lunch });
    await act(async () => get().chooseProduct(productOf({ foodVariantId: 'v2' })));
    const ready = get().product;
    expect(ready?.status === StoreStatus.Loaded && [ready.product.name, ready.quantity.unit.key, ready.quantity.value]).toEqual([
      'Ayran · Az yağlı', 'glass', 1,
    ]);
    act(() => get().incrementAmount());
    expect(get().footerCalories).toBeCloseTo(78);
    act(() => get().setUnit({ key: 'ml', amount: 1 }));
    expect(get().footerCalories).toBeCloseTo(78);
    act(() => get().setVariant(0));
    expect(get().footerCalories).toBeCloseTo(114);
    await act(async () => get().submit());
    const entry = actions.addEntry.mock.calls[0][0];
    expect([entry.name, entry.servings, entry.recipeId]).toEqual(['Ayran · Klasik', 300, null]);
    expect(entry.product).toEqual({ source: 'curated', foodVariantId: 'v1', offBarcode: null, unitKey: 'ml', unitAmount: 1 });
  });

  it('edits a product entry by its quantity, which the server rescales', async () => {
    const entry = foodLogEntryOf({
      name: 'Ayran · Az yağlı', servings: 1, nutrients: nutrientsOf({ calories: 52 }), recipeId: null,
      product: { source: 'curated', foodVariantId: 'v2', offBarcode: null, unitKey: 'glass', unitAmount: 200 },
    });
    const { actions, get } = setup({ kind: AddFoodRequestKind.Edit, entry });
    expect(get().product?.status).toBe(StoreStatus.Loaded);
    act(() => get().incrementAmount());
    expect(get().footerCalories).toBeCloseTo(78);
    await act(async () => get().submit());
    expect(actions.updateEntry).toHaveBeenCalledWith(entry, { servings: 1.5 });
  });

  it('removes an edited entry', async () => {
    const entry = foodLogEntryOf();
    const { actions, onClose, get } = setup({ kind: AddFoodRequestKind.Edit, entry });
    await act(async () => get().remove());
    expect(onClose).toHaveBeenCalled();
    expect(actions.deleteEntry).toHaveBeenCalledWith(entry);
  });
});
