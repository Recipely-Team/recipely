import { CharConstants } from '@core/constants';
import { isNonEmptyString, isString } from '@core/guards/type-guards';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import type { LogFoodArgs } from '@presentation/base/hooks/assistant/args/diary/parsing/log-food-args';
import { parseJsonObject } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-json-object';
import { parseMealArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-meal-arg';
import { readNumber } from '@presentation/base/hooks/assistant/args/diary/parsing/read-number';

const NO_ARGS: LogFoodArgs = { name: null, meal: null, servings: null, date: null, perServing: null };

/** A macro the model may leave out; unreadable counts as absent rather than failing the whole call. */
const macro = (value: unknown): number | null => {
  const n = readNumber(value);
  return n === undefined || Number.isNaN(n) ? null : n;
};

/**
 * `logFood`'s arg (diary contract): a JSON object, or — as models do — a bare
 * name. Empty is allowed and means "the open recipe" where there is one.
 */
export const parseLogFoodArg = (arg: string | undefined): ArgParse<LogFoodArgs> => {
  const raw = (arg ?? CharConstants.empty).trim();
  if (raw.length === 0) return { ok: true, value: NO_ARGS };
  const json = parseJsonObject(raw);
  if (json === undefined) return { ok: true, value: { ...NO_ARGS, name: raw } };
  if (json === null) return { ok: false, error: DiaryArgError.InvalidJson };

  const meal = parseMealArg(json.meal);
  if (!meal.ok) return meal;
  const servings = readNumber(json.servings);
  if (servings !== undefined && Number.isNaN(servings)) return { ok: false, error: DiaryArgError.InvalidServings };
  const calories = readNumber(json.calories);
  if (calories !== undefined && Number.isNaN(calories)) return { ok: false, error: DiaryArgError.InvalidNumber };

  return {
    ok: true,
    value: {
      name: isNonEmptyString(json.name) ? json.name.trim() : null,
      meal: meal.value,
      servings: servings ?? null,
      date: isString(json.date) ? json.date : null,
      perServing:
        calories === undefined
          ? null
          : { calories, protein: macro(json.protein), carbs: macro(json.carbs), fat: macro(json.fat), fiber: macro(json.fiber) },
    },
  };
};
