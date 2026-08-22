import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';

/**
 * The screen that answers each action, for actions only one screen answers.
 *
 * @remarks
 * - **Why this exists.** Screen-scoped handlers register on mount, so an action
 *   asked for from anywhere else found no handler and came back
 *   `unavailable_here` — "update the about section of my profile" was refused
 *   by an app that supports exactly that, because the user was not already on
 *   the edit-profile screen. A user does not think in screens; they think in
 *   things they want done.
 * - **Keys are the navigation vocabulary**, not routes, so a screen that moves
 *   changes in one place.
 * - **Recipe actions are absent on purpose.** Liking, saving, sharing, the
 *   timers and the step toggles all act on the recipe currently open; there is
 *   no screen to send someone to without first knowing WHICH recipe, and
 *   guessing one would act on the wrong thing.
 */
export const ASSISTANT_ACTION_HOMES: Readonly<Partial<Record<AssistantActionType, string>>> = {
  [AssistantAction.UpdateProfile]: 'editProfile',
  [AssistantAction.SetPreference]: 'settings',
  [AssistantAction.SignOut]: 'settings',
  [AssistantAction.ImportRecipe]: 'importRecipe',
  [AssistantAction.SetDraftField]: 'createRecipe',
  [AssistantAction.AddIngredient]: 'createRecipe',
  [AssistantAction.RemoveIngredient]: 'createRecipe',
  [AssistantAction.AddStep]: 'createRecipe',
  [AssistantAction.RemoveStep]: 'createRecipe',
  [AssistantAction.RefineDraft]: 'createRecipe',
  [AssistantAction.Regenerate]: 'createRecipe',
  [AssistantAction.PublishDraft]: 'createRecipe',
  [AssistantAction.AddFilter]: 'recipes',
  [AssistantAction.RemoveFilter]: 'recipes',
  [AssistantAction.ClearFilters]: 'recipes',
  [AssistantAction.Sort]: 'recipes',
  [AssistantAction.SwitchTab]: 'myRecipes',
  [AssistantAction.DeleteDraft]: 'myRecipes',
  [AssistantAction.MarkAllRead]: 'notifications',
};
