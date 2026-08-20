import { parseKeyValue } from '@presentation/base/hooks/assistant/parse-key-value';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';

/** The profile-editing capability this hook needs, named where it is consumed. */
interface AssistantProfileActionsDeps {
  onChangeName: (value: string) => void;
  onChangeBio: (value: string) => void;
}

const NAME_FIELD = 'displayName';
const BIO_FIELD = 'bio';

/**
 * Lets the assistant fill in the profile form the user is looking at.
 *
 * @remarks
 * - **It writes the field; it does not save.** Saving publishes under the
 *   user's name, so the assistant fills the form and the user taps save —
 *   which is also what makes the change reviewable before it is real. The
 *   result says `awaiting` so the model tells them so out loud.
 * - **Two fields, deliberately.** A bio the assistant composed is the case
 *   worth having, and it arrives as `bio=<text>` like everything else rather
 *   than through a second action word — one capability, one word.
 */
export const useAssistantProfileActions = (deps: AssistantProfileActionsDeps): void => {
  const { onChangeName, onChangeBio } = deps;

  useAssistantAction(
    AssistantAction.UpdateProfile,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const parsed = parseKeyValue(arg);
        if (parsed === null) return { ok: false, error: 'expected_field_equals_value' };

        const { key: field, value } = parsed;

        if (field === NAME_FIELD) {
          onChangeName(value);
          return { ok: true, awaiting: true };
        }
        if (field === BIO_FIELD) {
          onChangeBio(value);
          return { ok: true, awaiting: true };
        }
        return { ok: false, error: 'unknown_field' };
      },
      [onChangeName, onChangeBio],
    ),
  );
};
