import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import type { ProfileStatsState } from '@presentation/app/profile/model/profile-stats-state';
import { StoreStatus } from '@application/store/store-status';

/** What the profile screen lends the assistant. */
interface AssistantProfileScreenActionsDeps {
  displayName: string;
  /** The @handle under the name, which is what the screen prints — not the email. */
  handle: string;
  bio: string;
  /** The counts under the identity block, or a state that has none yet. */
  stats: ProfileStatsState;
  onPickAvatar: () => void;
  onEditProfile: () => void;
}

/** What the reading calls the rows below the stats. */
const ROWS_LABEL = 'rows';
/**
 * The rows this screen offers, in the order they are rendered.
 *
 * `helpAndFeedback` is on the list because it is the one a user is sent to
 * when something goes wrong — and the assistant now answers that itself with
 * `reportProblem` rather than reading the row number out.
 */
const PROFILE_ROWS: readonly string[] = [
  'editProfile',
  'myRecipes',
  'notifications',
  'settings',
  'helpAndFeedback',
];

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
  const { displayName, handle, bio, stats, onPickAvatar, onEditProfile } = deps;

  useAssistantScreenContent(() =>
    [`name=${displayName}`, ...statLines(stats)].join(SCREEN_PART_SEPARATOR),
  );

  useAssistantScreenReading(() =>
    [
      `name=${displayName}`,
      `handle=${handle}`,
      `bio=${bio}`,
      ...statLines(stats),
      listReading(ROWS_LABEL, PROFILE_ROWS),
    ].join(SCREEN_PART_SEPARATOR),
  );

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

/**
 * The counts, or nothing at all.
 *
 * A screen line that said `recipes=0` while the row was still loading is worse
 * than one that says nothing: the model reads it as an answer and tells the
 * user they have published nothing.
 */
function statLines(stats: ProfileStatsState): string[] {
  if (stats.status !== StoreStatus.Loaded) return [];
  return [
    `recipes=${stats.recipeCount}`,
    `likes=${stats.totalLikes}`,
    `views=${stats.totalViews}`,
    `saved=${stats.savedCount}`,
  ];
}
