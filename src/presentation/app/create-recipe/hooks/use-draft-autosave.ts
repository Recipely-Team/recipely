import { useCallback, useEffect, useRef } from 'react';
import { editableHasContent } from '@presentation/app/create-recipe/model/drafting/editable-has-content';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { UpsertDraftStoreInput } from '@application/drafts/write/upsert-draft-store-input';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
const DEBOUNCE_MS = 500;

interface UseDraftAutosaveArgs {
  enabled: boolean;
  draftId: string;
  prompt: string;
  recipe: EditableRecipe;
  /**
   * The snapshot the editor was opened with, so fields it has no field for
   * survive a save. Autosave fires on OPEN, so without this, looking at an
   * imported draft was enough to erase its cover and everything the AI found.
   */
  carried: DraftRecipeSnapshot | undefined;
  chatHistory: ChatMessage[];
  upsertDraft: (input: UpsertDraftStoreInput) => Promise<unknown>;
}

/**
 * Debounced draft persistence: whenever the editable model or chat changes in
 * the preview phase (and the flow is enabled), the working recipe is upserted
 * to the backend ~500ms later so an accidental exit never loses work.
 *
 * Returns a `cancel` for the one case where saving is the wrong outcome:
 * discarding the draft. The delete and a pending autosave were racing, and the
 * autosave could win — the user chose "leave without saving", the delete went
 * out, and the timer armed by their last keystroke fired 100ms later and put
 * the draft straight back. Cancelling is a ref flip rather than a state change
 * on purpose: the caller deletes on the very next line, and a re-render is not
 * guaranteed to have happened by then.
 *
 * And a `flush` for Save: a save inside the debounce window sent `fromDraftId`
 * for a draft not yet written — the server could not see its prompt, so a
 * generated recipe lost its AI mark — and the timer then fired after the save
 * had retired the draft, leaving a ghost copy. Save flushes first and cancels
 * before retiring.
 */
export const useDraftAutosave = ({
  enabled,
  draftId,
  prompt,
  recipe,
  carried,
  chatHistory,
  upsertDraft,
}: UseDraftAutosaveArgs): { cancel: () => void; flush: () => Promise<void> } => {
  // Keep the latest values in a ref so the timer always reads fresh data
  // without re-arming on every keystroke beyond the debounce window.
  const latest = useRef({ prompt, recipe, carried, chatHistory });
  latest.current = { prompt, recipe, carried, chatHistory };

  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const write = useCallback(
    (): Promise<unknown> =>
      upsertDraft({
        id: draftId,
        prompt: latest.current.prompt,
        snapshot: editableToSnapshot(latest.current.recipe, latest.current.carried),
        chatHistory: latest.current.chatHistory,
      }),
    [draftId, upsertDraft],
  );

  useEffect(() => {
    if (cancelled.current || !enabled || !editableHasContent(recipe)) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      void write();
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [enabled, recipe, chatHistory, write]);

  const cancel = useCallback((): void => {
    cancelled.current = true;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    if (timer.current === null || cancelled.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    await write();
  }, [write]);

  return { cancel, flush };
};
