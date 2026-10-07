import type { RequestMapper } from '@core/mapper/request-mapper';
import type { MealParseTextRequestDto } from '@infrastructure/diary/meal/write/meal-parse-text-request-dto';

/** A description (and its locale) → the JSON body; the text is trimmed, a null locale is left out. */
export const toMealParseTextRequest: RequestMapper<{ text: string; locale: string | null }, MealParseTextRequestDto> = (input) => ({
  text: input.text.trim(),
  ...(input.locale === null ? {} : { locale: input.locale }),
});
