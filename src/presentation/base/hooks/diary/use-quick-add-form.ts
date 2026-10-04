import { useState } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import { parseDecimalInput } from '@presentation/base/utils/diary/parse-decimal-input';
import type { QuickAddForm } from '@presentation/base/widgets/diary/add-food/state/quick-add-form';

/**
 * The Quick add tab (design spec → Food Diary §6): a name, calories and
 * optional P/C/F grams, logged as one serving with no recipe behind it. A
 * search with no results opens it with the query as the name.
 *
 * @remarks
 * - **Validation is the domain's.** The figures go through `Nutrients.create`
 *   and the name through `LoggableFood.quickAdd`; the form only reads whether
 *   they accepted it, so the submit button can never disagree with the server.
 * - **Zero kcal is not a food** — `quickAdd` refuses it, which keeps submit
 *   disabled until the kcal are above zero (design spec §6).
 */
export const useQuickAddForm = (initialMeal: MealSlotType, initialName: string = CharConstants.empty): QuickAddForm => {
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState(CharConstants.empty);
  const [protein, setProtein] = useState(CharConstants.empty);
  const [carbs, setCarbs] = useState(CharConstants.empty);
  const [fat, setFat] = useState(CharConstants.empty);
  const [meal, setMeal] = useState(initialMeal);

  const kcal = parseDecimalInput(calories);
  const macros = { protein: parseDecimalInput(protein), carbs: parseDecimalInput(carbs), fat: parseDecimalInput(fat) };
  const perServing = Nutrients.create({ calories: kcal ?? ValueConstants.zero, ...macros, fiber: null });
  const built = perServing.ok && kcal !== null ? LoggableFood.quickAdd(name, perServing.value) : null;

  return {
    name,
    calories,
    protein,
    carbs,
    fat,
    meal,
    setName,
    setCalories,
    setProtein,
    setCarbs,
    setFat,
    setMeal,
    macroCalories: perServing.ok && perServing.value.hasMacros ? perServing.value.macroCalories : null,
    food: built?.ok === true ? built.value : null,
  };
};
