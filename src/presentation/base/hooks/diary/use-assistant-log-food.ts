import { useCallback } from 'react';
import { ValueConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { defaultMealForHour } from '@domain/diary/entry/default-meal-for-hour';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import { Servings } from '@domain/diary/entry/servings';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useRecipeFoodSources } from '@presentation/base/hooks/diary/use-recipe-food-sources';
import { useRecipeFoodLoader } from '@presentation/base/hooks/diary/use-recipe-food-loader';
import { buildFoodCandidates } from '@presentation/base/hooks/assistant/args/diary/build-food-candidates';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { failureReason } from '@presentation/base/hooks/assistant/args/diary/failure-reason';
import { rankByName } from '@presentation/base/hooks/assistant/args/diary/rank-by-name';
import { foldForMatch } from '@presentation/base/hooks/assistant/args/resolving/fold-for-match';
import { resolveDiaryDate } from '@presentation/base/hooks/assistant/args/diary/resolve-diary-date';
import { parseLogFoodArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-log-food-arg';
import type { LogFoodArgs } from '@presentation/base/hooks/assistant/args/diary/parsing/log-food-args';

/** What the screen registering `logFood` lends it. */
interface AssistantLogFoodOptions {
  /** Recipe Detail's own recipe, logged when the arg names nothing; null on the diary. */
  openRecipeFood: LoggableFood | null;
  /** The day a call without `date` logs to: the selected day on the diary, today elsewhere. */
  defaultDate: () => CalendarDate;
  /** Told the day the food went to, so the diary can show it. */
  onLogged: (date: CalendarDate) => void;
  /** False for a guest on Recipe Detail: there is no diary to log to. */
  signedIn: boolean;
}

/**
 * `logFood` (docs/diary-assistant-contract.md): resolve the food, the amount,
 * the meal and the day, then log it through the store like the sheet does.
 *
 * @remarks
 * - **A name is matched, not trusted.** The user's recipes, saved ones, the
 *   loaded feed and recent foods are ranked by name; the best one's own
 *   nutrition is used. Only when nothing matches do the model's numbers make a
 *   quick-add food — and with no numbers the call is sent back asking for them.
 * - **The model's numbers beat a loose match.** When it sent calories it was
 *   estimating a generic food, so only an exact name may override them —
 *   "bread" must not log the feed's "Banana Bread".
 * - **Every value goes through the domain** (`Servings.create`,
 *   `Nutrients.create`, `LoggableFood.quickAdd`, `CalendarDate`), so the model
 *   is refused exactly what the Add food sheet would refuse.
 */
export const useAssistantLogFood = ({ openRecipeFood, defaultDate, onLogged, signedIn }: AssistantLogFoodOptions): void => {
  const { diaryStore } = useStores();
  const sources = useRecipeFoodSources();
  const loader = useRecipeFoodLoader();

  const resolveFood = useCallback(
    async (args: LogFoodArgs): Promise<LoggableFood | string> => {
      const name = args.name;
      if (name === null) return openRecipeFood ?? DiaryArgError.MissingName;
      const exactOnly = args.perServing !== null;
      const pick = <T extends { name: string }>(items: readonly T[]): T | undefined =>
        rankByName(items, (c) => c.name, name).find((c) => !exactOnly || foldForMatch(c.name) === foldForMatch(name));
      const openMatch = pick(openRecipeFood === null ? [] : [{ name: openRecipeFood.name, food: openRecipeFood }]);
      if (openMatch !== undefined) return openMatch.food;
      const best = pick(buildFoodCandidates(sources, diaryStore.getState().recent));
      if (best?.kind === 'food') return best.food;
      if (best?.kind === 'recipe') return (await loader.open(best.recipe.id)) ?? DiaryArgError.RecipeNotLoaded;
      if (args.perServing === null) return DiaryArgError.UnknownFood;
      const nutrients = Nutrients.create(args.perServing);
      if (!nutrients.ok) return failureReason(nutrients.failure);
      const quick = LoggableFood.quickAdd(name, nutrients.value);
      return quick.ok ? quick.value : failureReason(quick.failure);
    },
    [diaryStore, loader, openRecipeFood, sources],
  );

  useAssistantAction(
    AssistantAction.LogFood,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (!signedIn) return { ok: false, error: 'signed_out' };
        const parsed = parseLogFoodArg(arg);
        if (!parsed.ok) return { ok: false, error: parsed.error };
        const args = parsed.value;
        const now = new Date();
        const date = args.date === null ? { ok: true as const, value: defaultDate() } : resolveDiaryDate(args.date, CalendarDate.today(now));
        if (!date.ok) return { ok: false, error: date.error };
        const servings = Servings.create(args.servings ?? ValueConstants.one);
        if (!servings.ok) return { ok: false, error: DiaryArgError.InvalidServings };
        const food = await resolveFood(args);
        if (isString(food)) return { ok: false, error: food };
        const meal = args.meal ?? defaultMealForHour(now.getHours());
        const entry = food.entryFor(date.value, meal, servings.value);
        const result = await diaryStore.getState().addEntry(entry);
        if (!result.ok) return { ok: false, error: failureReason(result.failure) };
        onLogged(date.value);
        return {
          ok: true,
          title: `Logged ${servings.value.value} serving(s) of ${food.name} to ${meal} on ${date.value.value}, ${Math.round(entry.nutrients.calories)} kcal`,
        };
      },
      [defaultDate, diaryStore, onLogged, resolveFood, signedIn],
    ),
  );
};
