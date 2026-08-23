import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';

/** What the profile screen lends the assistant. */
interface AssistantProfileScreenActionsDeps {
  onPickAvatar: () => void;
  onEditProfile: () => void;
}

/**
 * The profile screen, by voice.
 *
 * @remarks
 * - **`attachPhoto` means the avatar here** and a recipe photo on the create
 *   screen: one gesture, named once, meaning whatever screen the user is
 *   looking at. Both open a picker and let the user choose — a model must not
 *   pick a photo that goes out under their name.
 * - **`updateProfile` opens the editor rather than editing.** This screen only
 *   SHOWS the fields; the edit screen owns them and registers the same word
 *   with a handler that writes. The stack in the registry is what makes the
 *   inner screen's version win while it is open.
 */
export const useAssistantProfileScreenActions = (deps: AssistantProfileScreenActionsDeps): void => {
  const { onPickAvatar, onEditProfile } = deps;

  useAssistantAction(
    AssistantAction.AttachPhoto,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onPickAvatar();
      return { ok: true, awaiting: true };
    }, [onPickAvatar]),
  );

  useAssistantAction(
    AssistantAction.UpdateProfile,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onEditProfile();
      return { ok: true };
    }, [onEditProfile]),
  );
};
