import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import { Servings } from '@domain/diary/entry/servings';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';
import { entryListLine } from '@presentation/base/hooks/assistant/args/diary/entry-list-line';
import { failureReason } from '@presentation/base/hooks/assistant/args/diary/failure-reason';
import { matchEntries } from '@presentation/base/hooks/assistant/args/diary/match-entries';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import type { EntryTargetArgs } from '@presentation/base/hooks/assistant/args/diary/parsing/entry-target-args';
import { parseEntryTargetArg } from '@presentation/base/hooks/assistant/args/diary/parsing/parse-entry-target-arg';

/** The one entry an arg names, or the answer that sends the model back: nothing matched, or several did. */
type Target = { ok: true; entry: FoodLogEntryEntity; args: EntryTargetArgs } | { ok: false; result: AssistantActionResultType };

const findTarget = (day: DiaryDay | null, parsed: ArgParse<EntryTargetArgs>): Target => {
  if (!parsed.ok) return { ok: false, result: { ok: false, error: parsed.error } };
  if (day === null) return { ok: false, result: { ok: false, error: AssistantActionError.NotReady } };
  const matches = matchEntries(day.entries, parsed.value.name, parsed.value.meal);
  if (matches.length === ValueConstants.one && matches[0] !== undefined) return { ok: true, entry: matches[0], args: parsed.value };
  // Several: name them so the model asks "which one?". None: name the day's entries so it can retry with the right word.
  return matches.length > ValueConstants.one
    ? { ok: false, result: { ok: false, error: DiaryArgError.AmbiguousEntry, title: entryListLine(matches) } }
    : { ok: false, result: { ok: false, error: 'not_found', title: day.entries.length === 0 ? 'no entries on this day' : entryListLine(day.entries) } };
};

/**
 * `removeFood` and `changeFood` on the selected day — read from the store when
 * the call runs, not from the last render: "go to yesterday and remove the
 * menemen" queues `removeFood` right behind `selectDate`.
 *
 * The entry is found by name (and meal, when given); the write goes through the store the edit
 * sheet uses, and the change itself is the entity's own `changesTo`.
 */
export const useAssistantDiaryEntryActions = (): void => {
  const { diaryStore } = useStores();
  const selectedDay = useCallback((): DiaryDay | null => {
    const state = diaryStore.getState();
    return state.days[state.selectedDate.value] ?? null;
  }, [diaryStore]);

  useAssistantAction(
    AssistantAction.RemoveFood,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const target = findTarget(selectedDay(), parseEntryTargetArg(arg));
        if (!target.ok) return target.result;
        const result = await diaryStore.getState().deleteEntry(target.entry);
        if (!result.ok) return { ok: false, error: failureReason(result.failure) };
        return { ok: true, title: `removed ${target.entry.name} from ${target.entry.meal} on ${target.entry.date.value}` };
      },
      [diaryStore, selectedDay],
    ),
  );

  useAssistantAction(
    AssistantAction.ChangeFood,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const target = findTarget(selectedDay(), parseEntryTargetArg(arg));
        if (!target.ok) return target.result;
        const { entry, args } = target;
        const servings = args.servings === null ? null : Servings.create(args.servings);
        if (servings !== null && !servings.ok) return { ok: false, error: DiaryArgError.InvalidServings };
        const changes = entry.changesTo(servings?.value.value ?? entry.servings, args.toMeal ?? entry.meal);
        if (changes === null) return { ok: false, error: DiaryArgError.NothingToChange };
        const result = await diaryStore.getState().updateEntry(entry, changes);
        if (!result.ok) return { ok: false, error: failureReason(result.failure) };
        const updated = result.value;
        return {
          ok: true,
          title: `${updated.name} is now ${updated.servings} serving(s) in ${updated.meal}, ${Math.round(updated.nutrients.calories)} kcal`,
        };
      },
      [diaryStore, selectedDay],
    ),
  );
};
