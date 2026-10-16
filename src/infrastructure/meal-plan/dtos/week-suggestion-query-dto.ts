// Query of GET /me/meal-plan/suggestion: `meals` is a comma list (DINNER,LUNCH).
export interface WeekSuggestionQueryDto {
  weekStart: string;
  meals: string;
  seed: number;
}
