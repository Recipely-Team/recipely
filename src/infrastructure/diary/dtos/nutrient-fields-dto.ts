// The nutrient fields the diary DTOs share. A field the wire omits (the month
// rows carry no fiber) or sends as `null` is "not reported".
export interface NutrientFieldsDto {
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
}
