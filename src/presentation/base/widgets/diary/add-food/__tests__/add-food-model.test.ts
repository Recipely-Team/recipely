import { NetworkFailure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/store/paging/paged-list';
import { loadedList } from '@application/store/paging/loaded-list';
import { hitOf, pageOf, productOf } from '@application/diary/foods/__fixtures__/food-fixtures';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { initialAddFoodState } from '@presentation/base/widgets/diary/add-food/state/initial-add-food-state';
import { resolveProductStep } from '@presentation/base/widgets/diary/add-food/state/product/resolve-product-step';
import { ProductChoiceKind } from '@presentation/base/widgets/diary/add-food/state/product/product-choice-kind';
import { searchRows } from '@presentation/base/widgets/diary/add-food/list/search-rows';
import { phaseOfLists } from '@presentation/base/widgets/diary/add-food/list/phase-of-lists';
import { nextListToLoad } from '@presentation/base/widgets/diary/add-food/list/next-list-to-load';
import { PickPhase } from '@presentation/base/widgets/diary/add-food/list/pick-phase';

const date = CalendarDate.of(2026, 9, 30);
const at = (hour: number): Date => new Date(2026, 8, 30, hour);
const food = LoggableFood.of({ name: 'Menemen', perServing: nutrientsOf({ calories: 300 }), recipeId: 'r1', imageUrl: null });
const idle: PagedList<never> = { status: StoreStatus.Idle };
const titles = { saved: 'Saved', mine: 'My recipes', products: 'Products', recipes: 'Recipes' };

describe('initialAddFoodState', () => {
  it('opens the pick step with the meal from the clock when none is given', () => {
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Pick, date, meal: null }, at(13));
    expect(state.step).toBe(AddFoodStep.Pick);
    expect(state.meal).toBe(MealSlot.Lunch);
    expect(state.date.value).toBe('2026-09-30');
  });

  it('keeps a meal the caller chose, and a chosen food skips to the detail step at one serving', () => {
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Food, date, meal: MealSlot.Snacks, food }, at(8));
    expect(state.step === AddFoodStep.Detail && state.servings.value).toBe(1);
    expect(state.meal).toBe(MealSlot.Snacks);
    expect(state.canGoBack).toBe(false);
  });

  it('pre-fills a recipe edit from its entry, rounding the amount to the stepper', () => {
    const entry = foodLogEntryOf({ date: CalendarDate.of(2026, 9, 27), meal: MealSlot.Dinner, servings: 1.3 });
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Edit, entry }, at(8));
    expect(state.date.value).toBe('2026-09-27');
    expect(state.step === AddFoodStep.Detail && state.servings.value).toBe(1.5);
  });

  it('opens a product entry on the product step at its unit and quantity', () => {
    const entry = foodLogEntryOf({
      servings: 250, recipeId: null, nutrients: nutrientsOf({ calories: 65 }),
      product: { source: 'curated', foodVariantId: 'v2', offBarcode: null, unitKey: 'ml', unitAmount: 1 },
    });
    const state = initialAddFoodState({ kind: AddFoodRequestKind.Edit, entry }, at(8));
    expect(state.step).toBe(AddFoodStep.Product);
    if (state.step !== AddFoodStep.Product) return;
    const model = resolveProductStep(state.choice, { status: StoreStatus.Idle }, null, null);
    expect(model.status === StoreStatus.Loaded && [model.quantity.value, model.quantity.unit.key]).toEqual([250, 'ml']);
  });
});

describe('resolveProductStep', () => {
  const row = productOf({ foodVariantId: 'v1' });
  const choice = { kind: ProductChoiceKind.Listed, row } as const;

  it('is loading while the opened detail is another row’s', () => {
    const other = productOf({ foodVariantId: 'x' });
    expect(resolveProductStep(choice, { status: StoreStatus.Loading, key: other.key }, null, null).status).toBe(StoreStatus.Loading);
    expect(resolveProductStep(choice, { status: StoreStatus.Error, key: row.key, failure: new NetworkFailure('x') }, null, null).status).toBe(
      StoreStatus.Error,
    );
  });

  it('starts on the row’s variant at its first serving unit', () => {
    const detail = row.asDetail;
    if (detail === null) throw new Error('no detail');
    const model = resolveProductStep(choice, { status: StoreStatus.Loaded, key: row.key, detail }, null, null);
    expect(model.status === StoreStatus.Loaded && [model.variantIndex, model.quantity.unit.key, model.quantity.value, model.variants.length]).toEqual([
      0, 'glass', 1, 0,
    ]);
  });
});

describe('pick lists', () => {
  it('lists non-empty groups in order under their headings, with a next-page row while one loads', () => {
    const saved = { ...loadedList(pageOf([hitOf('s1')], 1, 9)), isLoadingMore: true };
    const rows = searchRows({ saved, mine: loadedList(pageOf([])), products: loadedList(pageOf([productOf()])), recipes: idle }, titles);
    expect(rows.map((row) => row.type)).toEqual(['heading', 'recipe', 'more', 'heading', 'product']);
  });

  // Backend #373 lists the Recipes tab's groups without deduping them.
  it('lists a recipe once, under Saved before My recipes', () => {
    const rows = searchRows(
      { saved: loadedList(pageOf([hitOf('a')])), mine: loadedList(pageOf([hitOf('a'), hitOf('b')])), products: idle, recipes: loadedList(pageOf([hitOf('a')])) },
      titles,
    );
    expect(rows.flatMap((row) => (row.type === 'recipe' ? [row.key] : []))).toEqual(['saved:a', 'mine:b']);
    expect(rows.filter((row) => row.type === 'heading')).toHaveLength(2);
  });

  it('shows rows that arrived, skeleton while nothing has, the error only when every group failed, empty when all are empty', () => {
    const failed: PagedList<never> = { status: StoreStatus.Error, failure: new NetworkFailure('x') };
    expect(phaseOfLists([loadedList(pageOf([hitOf('a')])), { status: StoreStatus.Loading }]).phase).toBe(PickPhase.Ready);
    expect(phaseOfLists([{ status: StoreStatus.Loading }, idle]).phase).toBe(PickPhase.Loading);
    expect(phaseOfLists([failed, failed]).phase).toBe(PickPhase.Error);
    expect(phaseOfLists([loadedList(pageOf([])), failed]).phase).toBe(PickPhase.Empty);
  });

  it('pages next the first list in display order that has more, one next page at a time', () => {
    const more = loadedList(pageOf([hitOf('a')], 1, 9));
    const busy = { ...loadedList(pageOf([hitOf('b')], 1, 9)), isLoadingMore: true };
    expect(nextListToLoad([{ key: 'saved', list: more }, { key: 'mine', list: more }])).toBe('saved');
    expect(nextListToLoad([{ key: 'saved', list: busy }, { key: 'mine', list: more }])).toBeNull();
    expect(nextListToLoad([{ key: 'saved', list: loadedList(pageOf([hitOf('a')])) }])).toBeNull();
  });
});
