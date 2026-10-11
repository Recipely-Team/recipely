/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: () => true, push: jest.fn(), setParams: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  usePathname: () => '/diary',
}));

import { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { NetworkFailure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import { MealPlanWeek } from '@domain/meal-plan/week/meal-plan-week';
import { mealPlanEntryOf } from '@domain/meal-plan/__fixtures__/meal-plan-entry-of';
import type { ApplicationStores } from '@application/di/application-stores';
import { configureMealPlanStore } from '@application/meal-plan/meal-plan-store';
import { LoadMealPlanWeekUseCase } from '@application/meal-plan/read/load-meal-plan-week-use-case';
import { BuildPlanShoppingListUseCase } from '@application/meal-plan/read/build-plan-shopping-list-use-case';
import { AddMealPlanEntryUseCase } from '@application/meal-plan/write/add-meal-plan-entry-use-case';
import { UpdateMealPlanEntryUseCase } from '@application/meal-plan/write/update-meal-plan-entry-use-case';
import { RemoveMealPlanEntryUseCase } from '@application/meal-plan/write/remove-meal-plan-entry-use-case';
import { SetMealEatenUseCase } from '@application/meal-plan/write/set-meal-eaten-use-case';
import { ClearMealPlanWeekUseCase } from '@application/meal-plan/write/clear-meal-plan-week-use-case';
import { CopyPreviousWeekUseCase } from '@application/meal-plan/write/copy-previous-week-use-case';
import { RestoreMealPlanEntriesUseCase } from '@application/meal-plan/write/restore-meal-plan-entries-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { PlanView, type PlanViewProps } from '@presentation/app/diary/body/plan/plan-view';
import { PlanViewKind } from '@presentation/app/diary/model/plan/plan-view-kind';
import { t } from '@presentation/i18n';

const day = (raw: string): CalendarDate => {
  const parsed = CalendarDate.create(raw);
  if (!parsed.ok) throw new Error(raw);
  return parsed.value;
};

const repo: MealPlanRepositoryInterface = {
  list: jest.fn(async () => ok([])),
  ingredients: jest.fn(async () => ok([])),
  add: jest.fn(async () => ok(mealPlanEntryOf())),
  update: jest.fn(async () => ok(mealPlanEntryOf({ servings: 2.5 }))),
  remove: jest.fn(async () => ok(undefined)),
  setEaten: jest.fn(async () => ok(mealPlanEntryOf({ eaten: true }))),
  clear: jest.fn(async () => ok(undefined)),
  copyWeek: jest.fn(async () => ok({ copied: 0, skipped: 0 })),
};

const stores = (): Partial<ApplicationStores> =>
  ({
    mealPlanStore: configureMealPlanStore({
      isEnabled: async () => true,
      loadWeek: new LoadMealPlanWeekUseCase(repo),
      add: new AddMealPlanEntryUseCase(repo),
      update: new UpdateMealPlanEntryUseCase(repo),
      remove: new RemoveMealPlanEntryUseCase(repo),
      setEaten: new SetMealEatenUseCase(repo),
      clearWeek: new ClearMealPlanWeekUseCase(repo),
      copyPreviousWeek: new CopyPreviousWeekUseCase(repo),
      restore: new RestoreMealPlanEntriesUseCase(repo),
      shoppingList: new BuildPlanShoppingListUseCase(repo),
      searchRecipes: new SearchRecipeGroupUseCase({} as FoodCatalogRepositoryInterface),
    }),
  }) as unknown as Partial<ApplicationStores>;

const monday = day('2026-10-12');
const props = (view: PlanViewProps['view'], over: Partial<PlanViewProps> = {}): PlanViewProps => ({
  view,
  weekStart: monday,
  today: monday,
  selected: monday,
  isCurrentWeek: true,
  goal: 2000,
  wide: false,
  onSelect: jest.fn(),
  onPage: jest.fn(),
  onThisWeek: jest.fn(),
  onRetry: jest.fn(),
  header: null,
  isRefreshing: false,
  onRefresh: jest.fn(),
  contentStyle: {},
  ...over,
});

const texts = (root: ReturnType<typeof renderComponent>['root']): string[] =>
  root.findAllByType(Text).map((node) => [node.props.children].flat().filter((part) => typeof part === 'string').join(''));

describe('PlanView', () => {
  const strings = t().mealPlan;
  beforeEach(() => jest.clearAllMocks());

  it('asks a guest to sign in and shows no week', () => {
    const { root } = renderComponent(<PlanView {...props({ kind: PlanViewKind.SignedOut })} />, stores());
    expect(texts(root)).toContain(strings.signedOutTitle);
    expect(texts(root)).not.toContain(strings.shopCta);
  });

  it('offers a retry when the week failed to load', () => {
    const onRetry = jest.fn();
    const { root } = renderComponent(<PlanView {...props({ kind: PlanViewKind.Error, failure: new NetworkFailure('offline') }, { onRetry })} />, stores());
    act(() => (root.find((node) => node.props.label === strings.tryAgain).props as { onPress: () => void }).onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-week card, without the shopping button', () => {
    const { root } = renderComponent(<PlanView {...props({ kind: PlanViewKind.Week, week: MealPlanWeek.of(monday, []) })} />, stores());
    expect(texts(root)).toContain(strings.emptyTitle);
    expect(texts(root)).not.toContain(strings.shopCta);
  });

  it('lists the selected day\'s meals with the shopping button, and steps servings through the store', async () => {
    const week = MealPlanWeek.of(monday, [mealPlanEntryOf({ date: '2026-10-12' })]);
    const s = stores();
    await (s.mealPlanStore as ApplicationStores['mealPlanStore']).getState().load(monday);
    const { root } = renderComponent(<PlanView {...props({ kind: PlanViewKind.Week, week })} />, s);
    expect(texts(root)).toContain('Mercimek çorbası');
    expect(root.findAll((node) => node.props.label === strings.shopCta).length).toBeGreaterThan(0);
    const more = root.findAll((node) => node.props.accessibilityLabel === strings.increaseServings)[0];
    await act(async () => (more?.props as { onPress: () => void }).onPress());
    expect(repo.update).toHaveBeenCalledTimes(1);
  });
});
