import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';
import { configureDiaryStore } from '@application/diary/diary-store';
import { LoadDiaryDayUseCase } from '@application/diary/day/load-diary-day-use-case';
import { SetDayWaterUseCase } from '@application/diary/day/set-day-water-use-case';
import { LoadDiaryMonthUseCase } from '@application/diary/month/load-diary-month-use-case';
import { AddFoodLogEntryUseCase } from '@application/diary/entries/add-food-log-entry-use-case';
import { UpdateFoodLogEntryUseCase } from '@application/diary/entries/update-food-log-entry-use-case';
import { DeleteFoodLogEntryUseCase } from '@application/diary/entries/delete-food-log-entry-use-case';
import { LoadRecentFoodsUseCase } from '@application/diary/entries/load-recent-foods-use-case';
import { BuildLoggableFoodFromRecipeUseCase } from '@application/diary/entries/build-loggable-food-from-recipe-use-case';
import { LoadNutritionGoalsUseCase } from '@application/diary/goals/load-nutrition-goals-use-case';
import { SaveNutritionGoalsUseCase } from '@application/diary/goals/save-nutrition-goals-use-case';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import { configureFoodSearchStore } from '@application/diary/foods/food-search-store';
import { configureFoodCatalogStore } from '@application/diary/foods/food-catalog-store';
import { SearchFoodsUseCase } from '@application/diary/foods/search/search-foods-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { SearchProductsUseCase } from '@application/diary/foods/search/search-products-use-case';
import { ListFoodCategoriesUseCase } from '@application/diary/foods/browse/list-food-categories-use-case';
import { ListFoodProductsUseCase } from '@application/diary/foods/browse/list-food-products-use-case';
import { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import { LoadFoodDetailUseCase } from '@application/diary/foods/detail/load-food-detail-use-case';

/** **Diary composition** — the food diary, the food search and the food catalogue. */
export const registerDiary = (
  container: Container,
): Pick<
  ApplicationStores,
  | 'diaryStore'
  | 'foodSearchStore'
  | 'foodCatalogStore'
  | 'searchFoods'
  | 'listRecentFoods'
  | 'buildLoggableFoodFromRecipe'
> => {
  const diaryRepo = container.resolve<FoodDiaryRepositoryInterface>(TOKENS.FoodDiaryRepository);
  const diaryStore = configureDiaryStore({
    loadDay: new LoadDiaryDayUseCase(diaryRepo),
    loadMonth: new LoadDiaryMonthUseCase(diaryRepo),
    loadRecent: new LoadRecentFoodsUseCase(diaryRepo),
    addEntry: new AddFoodLogEntryUseCase(diaryRepo),
    updateEntry: new UpdateFoodLogEntryUseCase(diaryRepo),
    deleteEntry: new DeleteFoodLogEntryUseCase(diaryRepo),
    setWater: new SetDayWaterUseCase(diaryRepo),
    loadGoals: new LoadNutritionGoalsUseCase(diaryRepo),
    saveGoals: new SaveNutritionGoalsUseCase(diaryRepo),
  });
  const foodCatalogRepo = container.resolve<FoodCatalogRepositoryInterface>(TOKENS.FoodCatalogRepository);
  const searchFoods = new SearchFoodsUseCase(foodCatalogRepo);
  const listRecentFoods = new ListRecentFoodPageUseCase(foodCatalogRepo);
  const foodSearchStore = configureFoodSearchStore({
    searchFoods,
    searchRecipeGroup: new SearchRecipeGroupUseCase(foodCatalogRepo),
    searchProducts: new SearchProductsUseCase(foodCatalogRepo),
  });
  const foodCatalogStore = configureFoodCatalogStore({
    listCategories: new ListFoodCategoriesUseCase(foodCatalogRepo),
    listProducts: new ListFoodProductsUseCase(foodCatalogRepo),
    listRecent: listRecentFoods,
    loadDetail: new LoadFoodDetailUseCase(foodCatalogRepo),
  });
  return {
    diaryStore,
    foodSearchStore,
    foodCatalogStore,
    searchFoods,
    listRecentFoods,
    buildLoggableFoodFromRecipe: new BuildLoggableFoodFromRecipeUseCase(),
  };
};
