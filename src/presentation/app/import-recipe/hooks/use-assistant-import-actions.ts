import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { CharConstants } from '@core/constants';

/** What the import screen lends the assistant. */
interface AssistantImportActionsDeps {
  /** The link the screen was opened with, from a share sheet. */
  sharedUrl: string | undefined;
  onSubmitLink: (url: string) => void;
  onOpenDraft: () => void;
}

/**
 * Importing, by voice.
 *
 * A link is the one thing nobody dictates out loud — it arrives from a share
 * sheet, which is how this screen is reached at all. So the assistant's job
 * here is to submit what was shared and to open the draft once it is ready,
 * not to transcribe a URL character by character.
 */
export const useAssistantImportActions = (deps: AssistantImportActionsDeps): void => {
  const { sharedUrl, onSubmitLink, onOpenDraft } = deps;

  useAssistantAction(
    AssistantAction.ImportRecipe,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const url = arg ?? sharedUrl ?? CharConstants.empty;
        if (url === CharConstants.empty) return { ok: false, error: 'no_link' };

        onSubmitLink(url);
        return { ok: true };
      },
      [sharedUrl, onSubmitLink],
    ),
  );

  useAssistantAction(
    AssistantAction.OpenDraft,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onOpenDraft();
      return { ok: true };
    }, [onOpenDraft]),
  );
};
