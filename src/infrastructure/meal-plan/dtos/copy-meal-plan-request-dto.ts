// Body of `POST /me/meal-plan/copy` — two Mondays; the same week twice is a 400.
export interface CopyMealPlanRequestDto {
  fromWeekStart: string;
  toWeekStart: string;
}
