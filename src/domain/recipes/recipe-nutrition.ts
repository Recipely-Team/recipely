/** Per-serving nutrition as the backend reports it; every figure is optional. */
export interface RecipeNutrition {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  /** Weight of one serving in whole grams (20–3000); what makes "per 100 g" computable. */
  servingWeightGrams?: number;
}
