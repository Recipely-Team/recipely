import { CharConstants, ValueConstants } from '@core/constants';
import type { NutritionGoalValues } from '@domain/diary/nutrition/nutrition-goal-values';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { parseJsonObject } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-json-object';
import { readNumber } from '@presentation/base/hooks/assistant/args/diary/parsing/read-number';

/** The contract's field names, mapped onto the goal values (`water` is glasses). */
const FIELDS = [
  ['calories', 'calories'],
  ['protein', 'protein'],
  ['carbs', 'carbs'],
  ['fat', 'fat'],
  ['fiber', 'fiber'],
  ['water', 'waterGlasses'],
] as const;

/**
 * `setGoals`'s partial `{ calories?, protein?, carbs?, fat?, fiber?, water? }`,
 * as the fields to overwrite. Ranges are not checked here — the merged goals
 * go through `NutritionGoals.create`.
 */
export const parseGoalsArg = (arg: string | undefined): ArgParse<Partial<NutritionGoalValues>> => {
  const json = parseJsonObject(arg ?? CharConstants.empty);
  if (json === undefined || json === null) return { ok: false, error: DiaryArgError.InvalidJson };
  const changes: Partial<Record<keyof NutritionGoalValues, number>> = {};
  for (const [from, to] of FIELDS) {
    const value = readNumber(json[from]);
    if (value === undefined) continue;
    if (Number.isNaN(value)) return { ok: false, error: `${DiaryArgError.InvalidNumber}:${from}` };
    changes[to] = value;
  }
  if (Object.keys(changes).length === ValueConstants.zero) return { ok: false, error: DiaryArgError.NothingToSet };
  return { ok: true, value: changes };
};
