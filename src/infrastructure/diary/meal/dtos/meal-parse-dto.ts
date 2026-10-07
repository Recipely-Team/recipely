import type { MealParseItemDto } from '@infrastructure/diary/meal/dtos/meal-parse-item-dto';

// Response of `POST /diary/meal-parse`: at most 12 items and an optional note.
export interface MealParseDto {
  items: MealParseItemDto[];
  note?: string;
}
