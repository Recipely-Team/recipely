import { useMemo, useState } from 'react';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { RecipeServings } from '@domain/recipes/ingredients/recipe-servings';
import { UnitSystem, type UnitSystemType } from '@domain/recipes/ingredients/unit-system';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

interface PortionChoice {
  recipeId: string | null;
  servings: RecipeServings | null;
  system: UnitSystemType;
}

const servingsOf = (count: number): RecipeServings | null => {
  const result = RecipeServings.create(count);
  return result.ok ? result.value : null;
};

/**
 * Page-local portion state for the recipe detail: how many servings the
 * reader is cooking for and which units they read amounts in.
 *
 * @remarks
 * - **Resets per recipe**: the choice is remembered with the recipe id it was
 *   made for, so opening another recipe starts at its own servings and the
 *   original units without an effect-driven flash of the old ones.
 * - **The rules are the domain's** — `RecipeServings` steps and bounds,
 *   `IngredientList.present` scales and converts; this only holds the choice.
 * - **A recipe with an unreadable servings count is not scaled**: both
 *   stepper buttons are inert and the lines stay as written.
 */
export const usePortionScaling = (recipe: RecipeEntity | null): PortionScaling => {
  const recipeId = recipe?.id ?? null;
  const base = useMemo(() => servingsOf(recipe?.servings ?? ValueConstants.zero), [recipe?.servings]);
  const [stored, setChoice] = useState<PortionChoice>({ recipeId, servings: null, system: UnitSystem.Original });
  const choice = stored.recipeId === recipeId ? stored : { recipeId, servings: null, system: UnitSystem.Original };
  const servings = choice.servings ?? base;
  const decimalMark = t().recipes.portions.decimalMark;

  const ingredients = useMemo(() => {
    const factor = servings !== null && base !== null ? servings.factorFrom(base) : ValueConstants.one;
    return IngredientList.of(recipe?.ingredients ?? []).present(factor, choice.system, decimalMark);
  }, [recipe?.ingredients, servings, base, choice.system, decimalMark]);

  const step = (next: (current: RecipeServings) => RecipeServings) => (): void => {
    if (servings !== null) setChoice({ ...choice, servings: next(servings) });
  };

  return {
    servings: servings?.value ?? recipe?.servings ?? ValueConstants.zero,
    canIncrement: servings?.canIncrement ?? false,
    canDecrement: servings?.canDecrement ?? false,
    onIncrement: step((current) => current.increment()),
    onDecrement: step((current) => current.decrement()),
    unitSystem: choice.system,
    onChangeUnitSystem: (system) => setChoice({ ...choice, system }),
    ingredients,
  };
};
