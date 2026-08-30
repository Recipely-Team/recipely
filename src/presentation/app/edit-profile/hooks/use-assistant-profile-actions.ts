import { parseKeyValue } from '@presentation/base/hooks/assistant/args/resolving/parse-key-value';
import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import {
  EditProfileSaveOutcome,
  type EditProfileSaveOutcomeType,
} from '@presentation/app/edit-profile/model/edit-profile-save-outcome';
import { Answer, SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { CharConstants } from '@core/constants';

/** The profile-editing capability this hook needs, named where it is consumed. */
interface AssistantProfileActionsDeps {
  displayName: string;
  /** The about text, read back only when the user asks for the page. */
  bio: string;
  onChangeName: (value: string) => void;
  onChangeBio: (value: string) => void;
  /** The header button's own save; answers what it did rather than nothing. */
  onSave: () => Promise<EditProfileSaveOutcomeType>;
  /** True while the form differs from the signed-in profile. */
  isDirty: boolean;
}

const NAME_FIELD = 'displayName';
const BIO_FIELD = 'bio';
/** What the line calls a profile whose name field the user has emptied. */
const UNNAMED = 'unnamed';

/**
 * Lets the assistant fill in the profile form the user is looking at — and
 * press Save.
 *
 * @remarks
 * - **Writing a field is not saving it**, so `updateProfile` still answers
 *   `awaiting`: the model says the change is written and asks. What changed is
 *   that the answer now reaches something. Filling the form and leaving Save
 *   to a thumb stranded the request on a screen built for someone whose hands
 *   are busy, and the user watched the assistant say it could not press it.
 * - **Three words for one act, because that is what people say.** "Kaydet" is
 *   `save`, "evet" to the question just asked is `confirm`, and both run the
 *   header's own handler. `cancel` leaves the form as it is — the change stays
 *   on screen, unsaved, which is the state the user can still see and undo.
 * - **The yes/no pair is registered only while the form is dirty.** With
 *   nothing pending there is no question to answer, and a stray "evet" said to
 *   something else must not reach this screen.
 * - **The outcome comes from the save, not from a flag read here.** Two tool
 *   calls in one turn run before React re-renders, so a `saveEnabled` checked
 *   at this level describes the form as it was BEFORE the field this same turn
 *   just wrote.
 */
export const useAssistantProfileActions = (deps: AssistantProfileActionsDeps): void => {
  const { displayName, bio, onChangeName, onChangeBio, onSave, isDirty } = deps;

  // `unsaved` is the fact the model acts on: it is what tells it there is
  // something to offer to save, on a screen where writing a field and saving
  // it are two separate acts.
  useAssistantScreenContent(() =>
    [
      `profile=${displayName === CharConstants.empty ? UNNAMED : displayName}`,
      `unsaved=${isDirty ? Answer.yes : Answer.no}`,
    ].join(SCREEN_PART_SEPARATOR),
  );

  // The form as it stands, for `readScreen`. The bio is off the screen line on
  // purpose — it is a paragraph, and the line is charged on every turn.
  useAssistantScreenReading(() =>
    [
      `name=${displayName === CharConstants.empty ? UNNAMED : displayName}`,
      `bio=${bio}`,
      `unsaved=${isDirty ? Answer.yes : Answer.no}`,
    ].join(SCREEN_PART_SEPARATOR),
  );

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

  const save = useCallback(async (): Promise<AssistantActionResultType> => {
    const outcome = await onSave();
    return outcome === EditProfileSaveOutcome.Saved ? { ok: true } : { ok: false, error: outcome };
  }, [onSave]);

  useAssistantAction(AssistantAction.Save, save);
  useAssistantAction(AssistantAction.Confirm, save, isDirty);
  useAssistantAction(
    AssistantAction.Cancel,
    useCallback(async (): Promise<AssistantActionResultType> => ({ ok: true }), []),
    isDirty,
  );
};
