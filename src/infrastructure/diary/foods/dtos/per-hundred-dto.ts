// Nutrients of 100 g or ml of a product; a macro the source never gave is null.
export interface PerHundredDto {
  kcal: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
}
