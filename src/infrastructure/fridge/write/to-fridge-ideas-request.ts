import type { RequestMapper } from '@core/mapper/request-mapper';
import { ValueConstants } from '@core/constants';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import type { FridgeIdeasInput } from '@domain/fridge/ideas/fridge-ideas-input';
import type { FridgeIdeasRequestDto } from '@infrastructure/fridge/dtos/fridge-ideas-request-dto';

/**
 * Ideas input → the JSON body. "Any time", no diet, nothing to exclude and an
 * unknown locale are left out, so the server applies its own defaults.
 */
export const toFridgeIdeasRequest: RequestMapper<FridgeIdeasInput, FridgeIdeasRequestDto> = (input) => ({
  ingredients: [...input.ingredients],
  servings: input.servings,
  ...(input.maxMinutes === null ? {} : { maxMinutes: input.maxMinutes }),
  ...(input.diet === FridgeDiet.None ? {} : { diet: input.diet }),
  ...(input.exclude.length === ValueConstants.zero ? {} : { exclude: [...input.exclude] }),
  ...(input.locale === null ? {} : { locale: input.locale }),
});
