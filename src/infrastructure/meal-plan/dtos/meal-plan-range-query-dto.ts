// Query of `GET /`, `GET /ingredients` and `DELETE /` under `/me/meal-plan` — inclusive, at most 14 days.
export interface MealPlanRangeQueryDto {
  from: string;
  to: string;
}
