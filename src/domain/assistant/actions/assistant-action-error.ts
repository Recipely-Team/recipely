/**
 * The action-result errors that more than one layer has to agree on.
 *
 * @remarks
 * Most errors a handler returns are read by the model and nothing else, so
 * they stay as free text next to the code that produces them. These two are
 * different: something else in the app branches on them, so a typo would be a
 * silently wrong decision rather than a slightly odd sentence.
 */
export const AssistantActionError = {
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
} as const;
