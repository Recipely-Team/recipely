import { useCallback } from 'react';
import { ValueConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { defaultMealForHour } from '@domain/diary/entry/default-meal-for-hour';
import { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { Servings } from '@domain/diary/entry/servings';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import { FIRST_PAGE } from '@domain/common/first-page';
import { PageSizes } from '@application/config/page-sizes';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { buildFoodCandidates } from '@presentation/base/hooks/assistant/args/diary/build-food-candidates';
import type { FoodCandidateType } from '@presentation/base/hooks/assistant/args/diary/food-candidate';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { failureReason } from '@presentation/base/hooks/assistant/args/diary/failure-reason';
import { rankByName } from '@presentation/base/hooks/assistant/args/diary/rank-by-name';
import { foldForMatch } from '@presentation/base/hooks/assistant/args/resolving/fold-for-match';
import { resolveDiaryDate } from '@presentation/base/hooks/assistant/args/diary/resolve-diary-date';
import { parseLogFoodArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-log-food-arg';
import type { LogFoodArgs } from '@presentation/base/hooks/assistant/args/diary/parsing/log-food-args';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';

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

/** A resolved food: its name, and how to log `servings` of it. */
interface ResolvedFood {
  name: string;
  entryFor: (date: CalendarDate, meal: MealSlotType, servings: Servings) => NewFoodLogEntry;
}

const asResolved = (food: LoggableFood): ResolvedFood => ({ name: food.name, entryFor: (date, meal, servings) => food.entryFor(date, meal, servings) });

/** A candidate as something to log; a product's "servings" count its default amount (1 glass, or 100 g). */
const fromCandidate = (candidate: FoodCandidateType): ResolvedFood => {
  if (candidate.kind === 'food') return asResolved(candidate.food);
  const product = candidate.product;
  const base = product.defaultQuantity();
  return {
    name: product.name,
    entryFor: (date, meal, servings) => product.entryFor(date, meal, FoodQuantity.of(base.unit, base.value * servings.value)),
  };
};

/**
 * `logFood` (docs/diary-assistant-contract.md): resolve the food, the amount,
 * the meal and the day, then log it through the store like the sheet does.
 *
 * @remarks
 * - **A name is searched on the server**, as the Add food sheet does — the
 *   user's saved and own recipes (drafts too), catalogue products and
 *   everyone's recipes — then ranked with the recent foods by name. Recent
 *   foods come from `/diary/foods/recent`, where a product keeps its unit:
 *   the old `/diary/recent` rows hold a product's totals and would log
 *   "Ayran, 0 kcal" once divided per serving.
 * - **The model's numbers beat a loose match.** When it sent calories it was
 *   estimating a generic food, so only an exact name may override them —
 *   "bread" must not log "Banana Bread".
 * - **Every value goes through the domain** (`Servings.create`,
 *   `Nutrients.create`, `LoggableFood.quickAdd`, `CalendarDate`), so the model
 *   is refused exactly what the Add food sheet would refuse.
 */
export const useAssistantLogFood = ({ openRecipeFood, defaultDate, onLogged, signedIn }: AssistantLogFoodOptions): void => {
  const { diaryStore, searchFoods, listRecentFoods } = useStores();

  const resolveFood = useCallback(
    async (args: LogFoodArgs): Promise<ResolvedFood | string> => {
      const name = args.name;
      if (name === null) return openRecipeFood === null ? DiaryArgError.MissingName : asResolved(openRecipeFood);
      const exactOnly = args.perServing !== null;
      const pick = <T extends { name: string }>(items: readonly T[]): T | undefined =>
        rankByName(items, (c) => c.name, name).find((c) => !exactOnly || foldForMatch(c.name) === foldForMatch(name));
      if (openRecipeFood !== null && pick([openRecipeFood]) !== undefined) return asResolved(openRecipeFood);
      const [found, recent] = await Promise.all([
        searchFoods.execute(name, PageSizes.foodSearch),
        listRecentFoods.execute(FIRST_PAGE),
      ]);
      const groups = found.ok
        ? { saved: found.value.saved.items, mine: found.value.mine.items, products: found.value.products.items, recipes: found.value.recipes.items }
        : null;
      const best = pick(buildFoodCandidates(groups, recent.ok ? recent.value.items : []));
      if (best !== undefined) return fromCandidate(best);
      if (args.perServing === null) return found.ok ? DiaryArgError.UnknownFood : failureReason(found.failure);
      const nutrients = Nutrients.create(args.perServing);
      if (!nutrients.ok) return failureReason(nutrients.failure);
      const quick = LoggableFood.quickAdd(name, nutrients.value);
      return quick.ok ? asResolved(quick.value) : failureReason(quick.failure);
    },
    [listRecentFoods, openRecipeFood, searchFoods],
  );

  useAssistantAction(
    AssistantAction.LogFood,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (!signedIn) return { ok: false, error: AssistantActionError.SignedOut };
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
        const amount = entry.product === null ? `${servings.value.value} serving(s)` : `${entry.servings} ${entry.product.unitKey}`;
        return {
          ok: true,
          title: `Logged ${amount} of ${food.name} to ${meal} on ${date.value.value}, ${Math.round(entry.nutrients.calories)} kcal`,
        };
      },
      [defaultDate, diaryStore, onLogged, resolveFood, signedIn],
    ),
  );
};
