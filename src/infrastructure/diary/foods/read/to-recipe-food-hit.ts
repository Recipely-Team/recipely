import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { RecipeHitDto } from '@infrastructure/diary/foods/dtos/recipe-hit-dto';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';

/** A searched recipe → `RecipeFoodHit`; an unpublished one is the viewer's draft. */
export const toRecipeFoodHit: Mapper<RecipeHitDto, RecipeFoodHit, ValidationFailure> = (dto) => {
  const perServing = toNutrients({
    calories: dto.caloriesPerServing,
    protein: dto.protein,
    carbs: dto.carbs,
    fat: dto.fat,
    fiber: dto.fiber,
  });
  if (!perServing.ok) return perServing;
  const imageUrl = dto.image !== null && dto.image.length > ValueConstants.zero ? dto.image : null;
  return ok(RecipeFoodHit.of({ id: dto.id, name: dto.name, imageUrl, perServing: perServing.value, isDraft: !dto.isPublished }));
};
