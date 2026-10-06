/**
 * Every short reason an assistant action can fail with (`AssistantActionResultType.error`).
 *
 * @remarks
 * - **One vocabulary.** The model reads these, and some of them the app branches
 *   on too (`NotReady`); spelled inline at ~70 call sites, a typo was a silently
 *   different reason. ESLint (`no-restricted-syntax` in eslint.config.js) now
 *   refuses a string literal as an action result's `error`.
 * - Diary argument errors keep their own vocabulary (`DiaryArgError`).
 */
export const AssistantActionError = {
  Empty: 'empty',
  EmptyPrompt: 'empty_prompt',
  ExpectedFieldEqualsValue: 'expected_field_equals_value',
  ExpectedKeyEqualsValue: 'expected_key_equals_value',
  ExpectedKindEqualsValue: 'expected_kind_equals_value',
  Failed: 'failed',
  LeavesTheApp: 'leaves_the_app',
  NoCookTime: 'no_cook_time',
  NoIngredients: 'no_ingredients',
  NoLink: 'no_link',
  NoSuchStep: 'no_such_step',
  NoTimer: 'no_timer',
  NotANumber: 'not_a_number',
  NotApplied: 'not_applied',
  NotFound: 'not_found',
  /**
   * The screen answers this action but has not finished loading what it needs.
   *
   * Distinct from `not_found` on purpose. A screen registers its handlers on
   * mount, which is before its data arrives, so a fallback that navigates and
   * asks immediately would be told the cuisine does not exist — by a screen
   * still fetching the list of cuisines. Inferring that from `not_found`
   * instead would make every genuinely missing thing wait for a retry it can
   * never pass.
   */
  NotReady: 'not_ready',
  NotYours: 'not_yours',
  NothingBehind: 'nothing_behind',
  NothingToScroll: 'nothing_to_scroll',
  NothingToSearch: 'nothing_to_search',
  ReportNotSent: 'report_not_sent',
  ScreenDidNotOpen: 'screen_did_not_open',
  ServingsNeedsRefine: 'servings_needs_refine',
  SignedOut: 'signed_out',
  TaxonomyNotLoaded: 'taxonomy_not_loaded',
  UnavailableHere: 'unavailable_here',
  UnknownAction: 'unknown_action',
  UnknownDifficulty: 'unknown_difficulty',
  UnknownDirection: 'unknown_direction',
  UnknownField: 'unknown_field',
  UnknownFilter: 'unknown_filter',
  UnknownLanguage: 'unknown_language',
  UnknownPalette: 'unknown_palette',
  UnknownPreference: 'unknown_preference',
  UnknownScreen: 'unknown_screen',
  UnknownSort: 'unknown_sort',
  UnknownTab: 'unknown_tab',
  UnknownTheme: 'unknown_theme',
} as const;

export type AssistantActionErrorType = (typeof AssistantActionError)[keyof typeof AssistantActionError];
