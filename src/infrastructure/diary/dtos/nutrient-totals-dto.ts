// The server's Σ of a day. The client recomputes totals from the entries, so
// this is typed for completeness and not read.
export interface NutrientTotalsDto {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}
