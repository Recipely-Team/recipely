/**
 * What a save attempt did, in the words the assistant reports back.
 *
 * @remarks
 * - **The save decides, not its caller.** Whether there is anything to save
 *   depends on state the form owns, and a caller that checked `saveEnabled`
 *   first was reading the PREVIOUS render: the assistant fills a field and
 *   says "save" in one turn, and those two tool calls run back to back before
 *   React has re-rendered. Asking the save itself is the only question that
 *   cannot be stale.
 * - **These strings are read by the model**, which turns them into a sentence.
 *   They are diagnostics, never user copy — the screen's own feedback is the
 *   toast and the error dialog.
 */
export const EditProfileSaveOutcome = {
  Saved: 'saved',
  Unchanged: 'nothing_to_save',
  NameRequired: 'name_required',
  Busy: 'already_saving',
  Failed: 'save_failed',
} as const;

export type EditProfileSaveOutcomeType = (typeof EditProfileSaveOutcome)[keyof typeof EditProfileSaveOutcome];
