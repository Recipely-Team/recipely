// `GET/PUT /diary/goals`, and the `goals` of a day or month. `fiber` is
// optional because a backend from before the fiber goal omits it; the mapper
// falls back to the default.
export interface NutritionGoalsDto {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  waterGlasses: number;
}
