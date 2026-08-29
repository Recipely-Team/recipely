/**
 * Everything the voice assistant is allowed to do, defined once.
 *
 * @remarks
 * - **One vocabulary, three consumers.** These strings become the `enum` of the
 *   single `runAction` tool declared to the model, the keys of the registry
 *   that dispatches a call, and the discriminant every handler matches on. They
 *   are the textbook case for rule 5: spelled out separately in those three
 *   places, a handler could be registered under a name the model was never told
 *   about and nothing would fail until a user asked for it out loud.
 * - **Why one tool and not twenty.** The Live API fixes its tool list when the
 *   session is set up and will not accept a new one mid-session. The assistant
 *   moves between screens while talking, so a per-screen tool list would mean
 *   reconnecting — paying setup and context again — on every navigation. One
 *   tool with an action enum costs about 200 tokens at setup instead of the
 *   1.5–2k a tool apiece would.
 * - **Nothing is listed that nothing performs.** `writeBio` and `repeat` were
 *   in the plan and are not here: a bio is written with `updateProfile`, one
 *   capability under one word, and repeating a sentence is something the model
 *   does by itself with no help from the app. A word offered to the model that
 *   no handler answers comes back as a failed call it has to explain away —
 *   the assistant looks broken for a thing it was told it could do.
 * - **Names are the model's, not the code's.** The model picks an action by
 *   reading these words, so they are chosen to be unambiguous to a reader with
 *   no schema: `unsave` rather than `removeFavorite`.
 */
export const AssistantAction = {
  Navigate: 'navigate',
  GoBack: 'goBack',
  OpenRecipe: 'openRecipe',
  OpenDraft: 'openDraft',
  DeleteDraft: 'deleteDraft',
  SwitchTab: 'switchTab',
  Refresh: 'refresh',
  Search: 'search',
  AddFilter: 'addFilter',
  RemoveFilter: 'removeFilter',
  ClearFilters: 'clearFilters',
  Sort: 'sort',
  Confirm: 'confirm',
  Cancel: 'cancel',
  Save: 'save',
  Unsave: 'unsave',
  Like: 'like',
  Unlike: 'unlike',
  GenerateRecipe: 'generateRecipe',
  SetDraftField: 'setDraftField',
  AddIngredient: 'addIngredient',
  RemoveIngredient: 'removeIngredient',
  AddStep: 'addStep',
  RemoveStep: 'removeStep',
  AttachPhoto: 'attachPhoto',
  RefineDraft: 'refineDraft',
  Regenerate: 'regenerate',
  PublishDraft: 'publishDraft',
  DeleteRecipe: 'deleteRecipe',
  ShareRecipe: 'shareRecipe',
  /** Opens the create screen already filled with an existing recipe, to change and re-publish. */
  DuplicateRecipe: 'duplicateRecipe',
  AddComment: 'addComment',
  UpdateProfile: 'updateProfile',
  SetPreference: 'setPreference',
  SignOut: 'signOut',
  MarkAllRead: 'markAllRead',
  MarkRead: 'markRead',
  ImportRecipe: 'importRecipe',
  ToggleIngredient: 'toggleIngredient',
  ToggleStep: 'toggleStep',
  StartTimer: 'startTimer',
  PauseTimer: 'pauseTimer',
  ResumeTimer: 'resumeTimer',
  StopTimer: 'stopTimer',
  ReadStep: 'readStep',
  /**
   * Reads the ingredient list aloud. Distinct from `toggleIngredient`, and the
   * reason is a real incident: asked to READ the ingredients, the model found
   * only the toggle and ticked all eleven of them off, leaving the cook to
   * undo a checklist by hand.
   */
  ReadIngredients: 'readIngredients',
  /**
   * Reads out what the screen the user is on is showing.
   *
   * The one action every screen answers, and the reason it exists is a report:
   * asked to read a draft that was open in front of the user, the assistant
   * had no word for "what is on this screen" — so it answered out of the
   * recipe vocabulary, found nothing registered, and told the user to go and
   * open the draft they were already looking at. A screen that shows something
   * describes itself; this is how the model asks.
   */
  ReadScreen: 'readScreen',
  /**
   * Sends a problem report to the developers, with what went wrong attached.
   *
   * Told about a save that had just failed, the assistant explained where the
   * feedback form was and left the user to fill it in. It has the failure, the
   * screen and the user's own words already; asking them to retype all three
   * into a form is the app declining to do the one thing it was asked.
   */
  ReportProblem: 'reportProblem',
  Scroll: 'scroll',
  Stop: 'stop',
} as const;

export type AssistantActionType = (typeof AssistantAction)[keyof typeof AssistantAction];
