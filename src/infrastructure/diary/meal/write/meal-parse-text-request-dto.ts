// JSON body of `POST /diary/meal-parse` for a described meal; `locale` only when known.
export interface MealParseTextRequestDto {
  text: string;
  locale?: string;
}
