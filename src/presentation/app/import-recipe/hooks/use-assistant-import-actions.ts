import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { CharConstants } from '@core/constants';
import type { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { IMPORT_STAGE_COUNT } from '@presentation/app/import-recipe/model/import-stage';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { Answer, SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';

/** What the import screen lends the assistant. */
interface AssistantImportActionsDeps {
  /** The link the screen was opened with, from a share sheet. */
  sharedUrl: string | undefined;
  /** What the queue is doing, or null before a job has been accepted. */
  jobStatus: ImportJobStatus | null;
  /** How many of the four checklist stages are ticked. */
  activeStage: number;
  /** Where in the queue this job sits, when the backend says. */
  queuePosition: number | null;
  isDone: boolean;
  onSubmitLink: (url: string) => void;
  onOpenDraft: () => void;
}

/** What the screen line calls a job that has not been accepted yet. */
const NO_JOB = 'none';

/**
 * Importing, by voice.
 *
 * A link is the one thing nobody dictates out loud — it arrives from a share
 * sheet, which is how this screen is reached at all. So the assistant's job
 * here is to submit what was shared and to open the draft once it is ready,
 * not to transcribe a URL character by character.
 */
export const useAssistantImportActions = (deps: AssistantImportActionsDeps): void => {
  const { sharedUrl, jobStatus, activeStage, queuePosition, isDone, onSubmitLink, onOpenDraft } = deps;

  // A wait screen still has something to say, and this one is asked about more
  // than most: "ne durumda" during an import had no answer at all, because the
  // model was told the route and nothing else.
  const describe = (): string =>
    [
      `import=${jobStatus ?? NO_JOB}`,
      `stage=${activeStage}/${IMPORT_STAGE_COUNT}`,
      ...(queuePosition === null ? [] : [`queue=${queuePosition}`]),
      `done=${isDone ? Answer.yes : Answer.no}`,
    ].join(SCREEN_PART_SEPARATOR);

  // The same words either way: the screen is four ticked boxes and a status,
  // so a reading of it is the status. Registering both is what keeps
  // `readScreen` from falling through to the bare route here.
  useAssistantScreenContent(describe);
  useAssistantScreenReading(describe);

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
