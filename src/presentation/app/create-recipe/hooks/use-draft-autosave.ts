import { useCallback, useEffect, useRef } from 'react';
import { editableHasContent } from '@presentation/app/create-recipe/model/drafting/editable-has-content';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import type { UseDraftAutosaveArgs } from '@presentation/app/create-recipe/model/drafting/use-draft-autosave-args';

const DEBOUNCE_MS = 500;

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
  chatHistory,
  upsertDraft,
}: UseDraftAutosaveArgs): (() => void) => {
  // Keep the latest values in a ref so the timer always reads fresh data
  // without re-arming on every keystroke beyond the debounce window.
  const latest = useRef({ prompt, recipe, chatHistory });
  latest.current = { prompt, recipe, chatHistory };

  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cancelled.current || !enabled || !editableHasContent(recipe)) return;
    timer.current = setTimeout(() => {
      void upsertDraft({
        id: draftId,
        prompt: latest.current.prompt,
        snapshot: editableToSnapshot(latest.current.recipe),
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
