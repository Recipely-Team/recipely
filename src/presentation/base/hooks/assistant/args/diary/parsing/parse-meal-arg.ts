import { isString } from '@core/guards/type-guards';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { foldForMatch } from '@presentation/base/hooks/assistant/args/resolving/fold-for-match';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';

/** The one spelling the model reaches for that is not the slot's own. */
const SINGULAR_SNACK = 'snack';

/** A meal field: absent → `null` (the caller defaults it), a slot name → the slot, anything else refused. */
export const parseMealArg = (value: unknown): ArgParse<MealSlotType | null> => {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (!isString(value)) return { ok: false, error: DiaryArgError.InvalidMeal };
  const folded = foldForMatch(value);
  if (folded === SINGULAR_SNACK) return { ok: true, value: MealSlot.Snacks };
  const meal = Object.values(MealSlot).find((slot) => slot === folded);
  return meal === undefined ? { ok: false, error: DiaryArgError.InvalidMeal } : { ok: true, value: meal };
};
