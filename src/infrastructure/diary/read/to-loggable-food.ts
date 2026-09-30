import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { RecentFoodDto } from '@infrastructure/diary/dtos/recent-food-dto';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';

/**
 * A recent food → `LoggableFood`. The server already normalises to one
 * serving; dividing by `servings` anyway keeps this right if it ever stops.
 */
export const toLoggableFood: Mapper<RecentFoodDto, LoggableFood, ValidationFailure> = (dto) => {
  const nutrients = toNutrients(dto);
  if (!nutrients.ok) return nutrients;
  const servings = dto.servings > ValueConstants.zero ? dto.servings : ValueConstants.one;
  return ok(
    LoggableFood.of({
      name: dto.name,
      perServing: nutrients.value.scale(ValueConstants.one / servings),
      recipeId: dto.recipeId,
      imageUrl: dto.recipeImageUrl,
    }),
  );
};
