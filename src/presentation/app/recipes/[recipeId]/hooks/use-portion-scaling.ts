import { useMemo } from 'react';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { RecipeServings } from '@domain/recipes/ingredients/recipe-servings';
import { UnitSystem, type UnitSystemType } from '@domain/recipes/ingredients/unit-system';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';
import { t } from '@presentation/i18n';
import { useStores } from '@presentation/bootstrap/use-stores';
import { ValueConstants } from '@core/constants';

const servingsOf = (count: number): RecipeServings | null => {
  const result = RecipeServings.create(count);
  return result.ok ? result.value : null;
};

/**
 * The reader's portion choice for a recipe: how many servings they cook for
 * and which units they read amounts in, with the lines that follow from it.
 *
 * @remarks
 * - **One choice per recipe for the session** (`portionChoiceStore`): the
 *   recipe page, cook mode and both assistants read the same lines, so what
 *   the cook sees, hears and adds to the shopping list agree.
 * - **Per recipe**: another recipe starts at its own servings and the original
 *   units.
 * - **The rules are the domain's** — `RecipeServings` steps and bounds,
 *   `IngredientList.present` scales and converts; this only holds the choice.
 * - **A recipe with an unreadable servings count is not scaled**: both
 *   stepper buttons are inert and the lines stay as written.
 */
export const usePortionScaling = (recipe: RecipeEntity | null): PortionScaling => {
  const recipeId = recipe?.id ?? null;
  const { portionChoiceStore } = useStores();
  const chosenServings = portionChoiceStore((s) => (recipeId === null ? null : s.byRecipe[recipeId]?.servings ?? null));
  const system: UnitSystemType = portionChoiceStore((s) => (recipeId === null ? undefined : s.byRecipe[recipeId]?.system) ?? UnitSystem.Original);
  const setServings = portionChoiceStore((s) => s.setServings);
  const setUnitSystem = portionChoiceStore((s) => s.setUnitSystem);
  const base = useMemo(() => servingsOf(recipe?.servings ?? ValueConstants.zero), [recipe?.servings]);
  const chosen = useMemo(() => (chosenServings === null ? null : servingsOf(chosenServings)), [chosenServings]);
  const servings = base === null ? null : chosen ?? base;
  const decimalMark = t().recipes.portions.decimalMark;

  const ingredients = useMemo(() => {
    const factor = servings !== null && base !== null ? servings.factorFrom(base) : ValueConstants.one;
    return IngredientList.of(recipe?.ingredients ?? []).present(factor, system, decimalMark);
  }, [recipe?.ingredients, servings, base, system, decimalMark]);

  const step = (next: (current: RecipeServings) => RecipeServings) => (): void => {
    if (servings !== null && recipeId !== null) setServings(recipeId, next(servings).value);
  };

  return {
    servings: servings?.value ?? recipe?.servings ?? ValueConstants.zero,
    canIncrement: servings?.canIncrement ?? false,
    canDecrement: servings?.canDecrement ?? false,
    onIncrement: step((current) => current.increment()),
    onDecrement: step((current) => current.decrement()),
    unitSystem: system,
    onChangeUnitSystem: (next) => {
      if (recipeId !== null) setUnitSystem(recipeId, next);
    },
    ingredients,
  };
};
