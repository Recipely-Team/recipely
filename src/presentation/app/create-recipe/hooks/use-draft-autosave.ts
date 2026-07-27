import { useEffect, useRef } from 'react';
import {
  editableHasContent,
  editableToSnapshot,
} from '@presentation/app/create-recipe/model/drafting/recipe-mapping';
import type { UseDraftAutosaveArgs } from '@presentation/app/create-recipe/model/drafting/use-draft-autosave-args';

const DEBOUNCE_MS = 500;

/**
 * Debounced draft persistence: whenever the editable model or chat changes in
 * the preview phase (and the flow is enabled), the working recipe is upserted
 * to the backend ~500ms later so an accidental exit never loses work.
 */
export const useDraftAutosave = ({
  enabled,
  draftId,
  prompt,
  recipe,
  chatHistory,
  upsertDraft,
}: UseDraftAutosaveArgs): void => {
  // Keep the latest values in a ref so the timer always reads fresh data
  // without re-arming on every keystroke beyond the debounce window.
  const latest = useRef({ prompt, recipe, chatHistory });
  latest.current = { prompt, recipe, chatHistory };

  useEffect(() => {
    if (!enabled || !editableHasContent(recipe)) return;
    const id = setTimeout(() => {
      void upsertDraft({
        id: draftId,
        prompt: latest.current.prompt,
        snapshot: editableToSnapshot(latest.current.recipe),
        chatHistory: latest.current.chatHistory,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [enabled, draftId, recipe, chatHistory, upsertDraft]);
};
