import { useCallback } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { PHOTO_NOTE_MAX_CHARS } from '@domain/common/photo-note';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';

/**
 * **The photo note, by voice** — "tell it to ignore the sauces" on the fridge
 * scan, "only the second recipe" on a file import.
 *
 * @remarks
 * - **The note lands in the field, not straight in a request.** The user sees
 *   what the assistant wrote and sends it with the photos as usual.
 * - **No argument clears the note**; a longer one is cut at the field's limit,
 *   the same stop typing meets.
 */
export const useAssistantPhotoNote = (onChangeNote: (note: string) => void): void => {
  useAssistantAction(
    AssistantAction.SetPhotoNote,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        onChangeNote((arg ?? CharConstants.empty).slice(ValueConstants.zero, PHOTO_NOTE_MAX_CHARS));
        return { ok: true };
      },
      [onChangeNote],
    ),
  );
};
