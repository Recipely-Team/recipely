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
 */
export const useDraftAutosave = ({
  enabled,
  draftId,
  prompt,
  recipe,
  carried,
  chatHistory,
  upsertDraft,
}: UseDraftAutosaveArgs): (() => void) => {
  // Keep the latest values in a ref so the timer always reads fresh data
  // without re-arming on every keystroke beyond the debounce window.
  const latest = useRef({ prompt, recipe, carried, chatHistory });
  latest.current = { prompt, recipe, carried, chatHistory };

  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cancelled.current || !enabled || !editableHasContent(recipe)) return;
    timer.current = setTimeout(() => {
      void upsertDraft({
        id: draftId,
        prompt: latest.current.prompt,
        snapshot: editableToSnapshot(latest.current.recipe, latest.current.carried),
        chatHistory: latest.current.chatHistory,
      });
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [enabled, draftId, recipe, chatHistory, upsertDraft]);

  return useCallback((): void => {
    cancelled.current = true;
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);
};
