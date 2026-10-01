import { isString } from '@core/guards/type-guards';
import { NutritionSource, type NutritionSourceType } from '@domain/recipes/nutrition/nutrition-source';

const KNOWN: ReadonlySet<string> = new Set(Object.values(NutritionSource));

/**
 * The nutrition source a wire value names, or `null` for anything this build
 * cannot credit — a source the app cannot name is better unnamed than misnamed.
 */
export const toNutritionSource = (raw: string | null | undefined): NutritionSourceType | null =>
  isString(raw) && KNOWN.has(raw) ? (raw as NutritionSourceType) : null;
