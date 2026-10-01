import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { FoodCategory } from '@domain/diary/foods/food-category';
import type { FoodCategoryDto } from '@infrastructure/diary/foods/dtos/food-category-dto';

/** A catalogue shelf → `FoodCategory`. */
export const toFoodCategory: Mapper<FoodCategoryDto, FoodCategory> = (dto) =>
  ok({ key: dto.key, name: dto.name, productCount: dto.productCount });
