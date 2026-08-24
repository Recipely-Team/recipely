/** Which questions are drawn over the create screen right now. */
interface OpenSheets {
  exitOpen: boolean;
  publishOpen: boolean;
  saveErrorOpen: boolean;
  saveIssueOpen: boolean;
  photosOpen: boolean;
}

/** Which of them the assistant may answer, and whether it may raise a new one. */
interface SheetGates {
  /**
   * What is drawn over the publish and refine confirmations. Their own gates
   * read `!exitOrErrorOpen`, so this must NOT include the publish sheet.
   */
  exitOrErrorOpen: boolean;
  /** Whether `goBack` is offered — it opens a question, so not from behind one. */
  canLeave: boolean;
  /** Whether the exit sheet is the question in front of the user. */
  isExitPending: boolean;
}

/**
 * Which sheet owns the spoken yes and no.
 *
 * @remarks
 * - **At most ONE confirmation is live at a time.** Two would let a user
 *   reading the modal on top answer the sheet behind it: the wrong action
 *   runs, and the model announces the one that did not.
 * - **A sheet is never in the gate that decides whether IT may be answered.**
 *   Both bugs this function exists to prevent are that mistake. `goBack` was
 *   ungated, so "çık" said to the publish confirmation opened the exit sheet
 *   underneath it and re-pointed "hayır" at discarding the draft. Folding the
 *   publish sheet into the value its own gate negates then made
 *   `publishOpen && !exitOrErrorOpen` unsatisfiable — the publish sheet could
 *   not be answered out loud at all, in any state.
 * - **It is a function so the invariant can be tested.** The gates were three
 *   boolean expressions in a routed component, where the only way to check
 *   them was to read them, and reading them is what missed it twice.
 */
export function assistantSheetGates(sheets: OpenSheets): SheetGates {
  const errorOrPhotosOpen = sheets.saveErrorOpen || sheets.saveIssueOpen || sheets.photosOpen;
  // Everything drawn over the EXIT sheet — itself excluded, for the reason above.
  const otherSheetOpen = sheets.publishOpen || errorOrPhotosOpen;

  return {
    exitOrErrorOpen: sheets.exitOpen || errorOrPhotosOpen,
    canLeave: !otherSheetOpen,
    isExitPending: sheets.exitOpen && !otherSheetOpen,
  };
}
