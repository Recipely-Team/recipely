import { CharConstants } from '@core/constants';
import { isNonEmptyString } from '@core/guards/type-guards';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import type { EntryTargetArgs } from '@presentation/base/hooks/assistant/args/diary/parsing/entry-target-args';
import { parseJsonObject } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-json-object';
import { parseMealArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-meal-arg';
import { readNumber } from '@presentation/base/hooks/assistant/args/diary/parsing/read-number';

/** `removeFood` / `changeFood`'s arg: `{ name, meal?, servings?, toMeal? }` or a plain name. */
export const parseEntryTargetArg = (arg: string | undefined): ArgParse<EntryTargetArgs> => {
  const raw = (arg ?? CharConstants.empty).trim();
  const json = parseJsonObject(raw);
  if (json === undefined) {
    return raw.length === 0
      ? { ok: false, error: DiaryArgError.MissingName }
      : { ok: true, value: { name: raw, meal: null, servings: null, toMeal: null } };
  }
  if (json === null) return { ok: false, error: DiaryArgError.InvalidJson };
  if (!isNonEmptyString(json.name)) return { ok: false, error: DiaryArgError.MissingName };
  const meal = parseMealArg(json.meal);
  if (!meal.ok) return meal;
  const toMeal = parseMealArg(json.toMeal);
  if (!toMeal.ok) return toMeal;
  const servings = readNumber(json.servings);
  if (servings !== undefined && Number.isNaN(servings)) return { ok: false, error: DiaryArgError.InvalidServings };
  return { ok: true, value: { name: json.name.trim(), meal: meal.value, servings: servings ?? null, toMeal: toMeal.value } };
};
