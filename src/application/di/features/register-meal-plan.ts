import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { MealPlanRepositoryInterface } from '@domain/meal-plan/meal-plan-repository-interface';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import type { FeatureFlagResolver } from '@application/config/feature-flag-resolver';
import { FeatureFlagName } from '@application/config/feature-flag-name';
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

/** **Meal plan composition** — the weekly planner's store, gated by the `MealPlanner` feature flag. */
export const registerMealPlan = (container: Container): Pick<ApplicationStores, 'mealPlanStore'> => {
  const repo = container.resolve<MealPlanRepositoryInterface>(TOKENS.MealPlanRepository);
  const foodCatalogRepo = container.resolve<FoodCatalogRepositoryInterface>(TOKENS.FoodCatalogRepository);
  const featureFlags = container.resolve<FeatureFlagResolver>(TOKENS.FeatureFlagResolver);
  const mealPlanStore = configureMealPlanStore({
    isEnabled: () => featureFlags.isOn(FeatureFlagName.MealPlanner),
    loadWeek: new LoadMealPlanWeekUseCase(repo),
    add: new AddMealPlanEntryUseCase(repo),
    update: new UpdateMealPlanEntryUseCase(repo),
    remove: new RemoveMealPlanEntryUseCase(repo),
    setEaten: new SetMealEatenUseCase(repo),
    clearWeek: new ClearMealPlanWeekUseCase(repo),
    copyPreviousWeek: new CopyPreviousWeekUseCase(repo),
    restore: new RestoreMealPlanEntriesUseCase(repo),
    shoppingList: new BuildPlanShoppingListUseCase(repo),
    searchRecipes: new SearchRecipeGroupUseCase(foodCatalogRepo),
  });
  return { mealPlanStore };
};
