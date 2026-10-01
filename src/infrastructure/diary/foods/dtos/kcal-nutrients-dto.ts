// Nutrients as the foods endpoints send them — `kcal`, not the entries'
// `calories`: a product's `per100` and a recent product's `perUnit`. A macro
// the source never gave is null.
export interface KcalNutrientsDto {
  kcal: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
}
