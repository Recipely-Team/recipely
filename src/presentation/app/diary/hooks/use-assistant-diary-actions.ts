import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { useAssistantLogFood } from '@presentation/base/hooks/diary/use-assistant-log-food';
import { useRecipeFoodSources } from '@presentation/base/hooks/diary/use-recipe-food-sources';
import { buildFoodCandidates } from '@presentation/base/hooks/assistant/args/diary/build-food-candidates';
import { failureReason } from '@presentation/base/hooks/assistant/args/diary/failure-reason';
import { rankByName } from '@presentation/base/hooks/assistant/args/diary/rank-by-name';
import { resolveDiaryDate } from '@presentation/base/hooks/assistant/args/diary/resolve-diary-date';
import { parseGoalsArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-goals-arg';
import { parseMealArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-meal-arg';
import { parseWaterArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-water-arg';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { useAssistantDiaryEntryActions } from '@presentation/app/diary/hooks/use-assistant-diary-entry-actions';
import { diaryDayReading } from '@presentation/app/diary/model/assistant/diary-day-reading';
import { diaryScreenLine } from '@presentation/app/diary/model/assistant/diary-screen-line';
import type { DiaryDayView } from '@presentation/app/diary/model/diary-day-view';
import type { UseDiarySheetsResult } from '@presentation/app/diary/model/use-diary-sheets-result';
import { useLocale } from '@presentation/i18n';

/** What the Day view lends the assistant. */
interface AssistantDiaryActionsDeps {
  view: DiaryDayView;
  selected: CalendarDate;
  today: CalendarDate;
  select: (date: CalendarDate) => void;
  sheets: UseDiarySheetsResult;
}

/** How many matches `searchFood` reads back — enough to choose from, few enough to say. */
const SEARCH_ANSWER_LIMIT = 5;

/**
 * The Food Diary by voice (docs/diary-assistant-contract.md).
 *
 * @remarks
 * - **Handlers drive the screen the way a thumb would**: `selectDate` moves the
 *   strip, `searchFood` / `openAddFood` / `openGoals` open the real sheets, and
 *   writes go through the same store actions the sheets use, so the user sees
 *   every change happen.
 * - **Answers are for the model**: a short English title with the outcome and
 *   the numbers, or a snake_case reason it can act on.
 */
export const useAssistantDiaryActions = ({ view, selected, today, select, sheets }: AssistantDiaryActionsDeps): void => {
  const { diaryStore } = useStores();
  const locale = useLocale();
  const sources = useRecipeFoodSources();
  const day = view.status === StoreStatus.Loaded ? view.day : null;

  useAssistantScreenContent(() => diaryScreenLine(view, selected, today));
  useAssistantScreenReading(() => diaryDayReading(view, selected, today, locale));

  useAssistantLogFood({
    openRecipeFood: null,
    defaultDate: useCallback(() => diaryStore.getState().selectedDate, [diaryStore]),
    signedIn: true,
    // The strip moves to the day the food went to, so the user sees it land.
    onLogged: useCallback(
      (date: CalendarDate) => {
        if (!date.equals(diaryStore.getState().selectedDate)) select(date);
      },
      [diaryStore, select],
    ),
  });
  useAssistantDiaryEntryActions(day);

  useAssistantAction(
    AssistantAction.SelectDate,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const date = resolveDiaryDate(arg ?? CharConstants.empty, CalendarDate.today());
        if (!date.ok) return { ok: false, error: date.error };
        select(date.value);
        return { ok: true, title: `selected ${date.value.value}` };
      },
      [select],
    ),
  );

  useAssistantAction(
    AssistantAction.SearchFood,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const query = (arg ?? CharConstants.empty).trim();
        if (query.length === 0) return { ok: false, error: 'nothing_to_search' };
        sheets.openSearch(query);
        const matches = rankByName(buildFoodCandidates(sources, diaryStore.getState().recent), (c) => c.name, query);
        if (matches.length === 0) return { ok: true, title: 'no matches', n: { matches: 0 } };
        return {
          ok: true,
          n: { matches: matches.length },
          title: matches
            .slice(0, SEARCH_ANSWER_LIMIT)
            .map((c) => `${c.name}, ${Math.round(c.kcal)} kcal per serving, ${c.source}`)
            .join(SCREEN_PART_SEPARATOR),
        };
      },
      [diaryStore, sheets, sources],
    ),
  );

  useAssistantAction(
    AssistantAction.AddWater,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const glasses = parseWaterArg(arg);
        if (!glasses.ok) return { ok: false, error: glasses.error };
        if (day === null) return { ok: false, error: AssistantActionError.NotReady };
        const next = day.withWater(day.waterGlasses + glasses.value);
        const result = await diaryStore.getState().setWater(day.date, next.waterGlasses);
        if (!result.ok) return { ok: false, error: failureReason(result.failure) };
        return { ok: true, title: `water ${next.waterGlasses}/${next.goals.waterGlasses} glasses on ${day.date.value}` };
      },
      [day, diaryStore],
    ),
  );

  useAssistantAction(
    AssistantAction.SetGoals,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const changes = parseGoalsArg(arg);
        if (!changes.ok) return { ok: false, error: changes.error };
        const goals = NutritionGoals.create({ ...diaryStore.getState().goals.value, ...changes.value });
        if (!goals.ok) return { ok: false, error: `invalid_goal:${goals.failure.field ?? failureReason(goals.failure)}` };
        const saved = await diaryStore.getState().saveGoals(goals.value);
        if (!saved.ok) return { ok: false, error: failureReason(saved.failure) };
        const g = saved.value;
        return {
          ok: true,
          title: `goals saved: ${g.calories} kcal, protein ${g.protein} g, carbs ${g.carbs} g, fat ${g.fat} g, fiber ${g.fiber} g, water ${g.waterGlasses} glasses`,
        };
      },
      [diaryStore],
    ),
  );

  useAssistantAction(
    AssistantAction.OpenGoals,
    useCallback(async (): Promise<AssistantActionResultType> => {
      sheets.openGoals();
      return { ok: true };
    }, [sheets]),
  );

  useAssistantAction(
    AssistantAction.OpenAddFood,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const meal = parseMealArg(arg === undefined || arg.trim().length === 0 ? undefined : arg);
        if (!meal.ok) return { ok: false, error: meal.error };
        sheets.openAdd(meal.value);
        return { ok: true };
      },
      [sheets],
    ),
  );
};
