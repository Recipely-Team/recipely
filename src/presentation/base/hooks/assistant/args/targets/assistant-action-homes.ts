import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { ASSISTANT_NAVIGATION_TARGETS } from '@presentation/base/hooks/assistant/args/targets/assistant-navigation-targets';

/**
 * The screen that answers each action, for the actions it is honest to carry.
 *
 * @remarks
 * - **Why this exists.** Screen-scoped handlers register on mount, so an action
 *   asked for from anywhere else came back `unavailable_here` — "update the
 *   about section of my profile" was refused by an app that does exactly that.
 *   A user does not think in screens; they think in things they want done.
 * - **The test for membership is whether the SUBJECT already exists.**
 *   `updateProfile` has one profile, `settings` one set of preferences,
 *   `notifications` one list. Navigating there and acting is the same thing the
 *   user would have done with their thumb.
 * - **Which is why the draft actions are NOT here.** Adding an ingredient needs
 *   a draft to add it to, and the create screen makes a new empty one on
 *   arrival — so "add two eggs", said from the feed, would have opened a blank
 *   editor and put two eggs in it. That is the same move as inventing a recipe
 *   when asked to copy one: answering a question about a thing that exists by
 *   creating a different thing. The recipe actions are absent for the same
 *   reason, and `attachPhoto` because an avatar and a recipe photo are
 *   different acts with no way to choose between them from the words alone.
 */
export const ASSISTANT_ACTION_HOMES: Readonly<
  Partial<Record<AssistantActionType, keyof typeof ASSISTANT_NAVIGATION_TARGETS>>
> = {
  [AssistantAction.UpdateProfile]: 'editProfile',
  [AssistantAction.SetPreference]: 'settings',
  [AssistantAction.SignOut]: 'settings',
  [AssistantAction.ImportRecipe]: 'importRecipe',
  [AssistantAction.MarkAllRead]: 'notifications',
  [AssistantAction.SwitchTab]: 'myRecipes',
  [AssistantAction.AddFilter]: 'recipes',
  [AssistantAction.RemoveFilter]: 'recipes',
  [AssistantAction.ClearFilters]: 'recipes',
  [AssistantAction.Sort]: 'recipes',
};
