import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { OsIntentId } from '@domain/assistant/os/os-intent-id';
import { OsIntentParameterKind } from '@domain/assistant/os/os-intent-parameter-kind';
import type { OsIntentEntry } from '@domain/assistant/os/os-intent-entry';

/**
 * What Siri, Spotlight and the launcher are told this app can do.
 *
 * @remarks
 * - **Two of these carry a sentence, and they do it differently.** Siri will
 *   not fill a freeform string from inside a shortcut phrase, so `searchRecipes`
 *   goes through Apple's `searchInApp` schema — which hands over its raw query
 *   in one turn — and `askRecipely` uses a phrase with no parameter at all and
 *   lets Siri ask a second question. Everything else takes an entity or nothing.
 * - **Only `askRecipely` is headless.** It is the one entry whose answer is a
 *   sentence rather than a screen; the rest end in a list, a form or a running
 *   timer, and showing those through a Siri snippet would be showing the app
 *   through a keyhole. It is also the only one that has no fixed action: the
 *   assistant reads the question and decides.
 * - **Four of these are launcher shortcuts, and they are the four that need
 *   nothing.** A static Android shortcut cannot ask a question, so an entry
 *   taking a recipe or a sentence cannot be one — `askRecipely` and
 *   `generateRecipe` qualify because the screen they open does the asking.
 * - **Nothing here invents a word.** Every non-null `action` is one the registry
 *   already answers, so rule U — which asks that every action have a handler —
 *   stays satisfied without a single new handler being written. What holds THIS
 *   list to the vocabulary is rule W, and rule X is what keeps a destructive
 *   word from being marked headless.
 */
export const OS_INTENT_CATALOGUE: readonly OsIntentEntry[] = [
  {
    id: OsIntentId.SearchRecipes,
    action: AssistantAction.Search,
    arg: null,
    parameter: OsIntentParameterKind.Text,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.searchRecipes',
  },
  {
    id: OsIntentId.AskRecipely,
    action: null,
    arg: null,
    parameter: OsIntentParameterKind.Text,
    launcherShortcut: true,
    headless: true,
    titleKey: 'osIntent.askRecipely',
  },
  {
    id: OsIntentId.OpenRecipe,
    action: AssistantAction.OpenRecipe,
    arg: null,
    parameter: OsIntentParameterKind.RecipeEntity,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.openRecipe',
  },
  {
    id: OsIntentId.SaveRecipe,
    action: AssistantAction.Save,
    arg: null,
    parameter: OsIntentParameterKind.RecipeEntity,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.saveRecipe',
  },
  {
    id: OsIntentId.LikeRecipe,
    action: AssistantAction.Like,
    arg: null,
    parameter: OsIntentParameterKind.RecipeEntity,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.likeRecipe',
  },
  {
    id: OsIntentId.StartTimer,
    action: AssistantAction.StartTimer,
    arg: null,
    parameter: null,
    launcherShortcut: true,
    headless: false,
    titleKey: 'osIntent.startTimer',
  },
  {
    id: OsIntentId.ReadIngredients,
    action: AssistantAction.ReadIngredients,
    arg: null,
    parameter: OsIntentParameterKind.RecipeEntity,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.readIngredients',
  },
  {
    id: OsIntentId.ReadNextStep,
    action: AssistantAction.ReadStep,
    arg: 'next',
    parameter: null,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.readNextStep',
  },
  {
    id: OsIntentId.GenerateRecipe,
    action: AssistantAction.GenerateRecipe,
    arg: null,
    parameter: OsIntentParameterKind.Text,
    launcherShortcut: true,
    headless: false,
    titleKey: 'osIntent.generateRecipe',
  },
  {
    id: OsIntentId.ImportRecipe,
    action: AssistantAction.ImportRecipe,
    arg: null,
    parameter: OsIntentParameterKind.Text,
    launcherShortcut: false,
    headless: false,
    titleKey: 'osIntent.importRecipe',
  },
  {
    id: OsIntentId.OpenMyRecipes,
    action: AssistantAction.Navigate,
    arg: 'myRecipes',
    parameter: null,
    launcherShortcut: true,
    headless: false,
    titleKey: 'osIntent.openMyRecipes',
  },
];
