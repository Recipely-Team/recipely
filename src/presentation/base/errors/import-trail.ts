/**
 * The steps of the import → open-draft flow, as they appear on a crash report.
 *
 * @remarks
 * Opening a finished import sometimes ends with the app gone: the user is
 * returned to Instagram and cannot re-enter without force-closing it. The
 * reports that arrive say where the process died and nothing about what it had
 * been asked to do — the same blank page for "died navigating", "died fetching
 * the draft" and "died rendering the editor", which are three different bugs
 * with three different fixes.
 *
 * These mark the boundaries between those, so the LAST breadcrumb on the next
 * report names the step. They are places in the code and carry no values: an id
 * or a URL on a crash report is user data leaving the device (rule 22).
 */
export const ImportTrail = {
  queueOpened: 'import: queue screen opened',
  jobDone: 'import: job reported done',
  openDraftTapped: 'import: open-draft tapped',
  openDraftMissing: 'import: open-draft had no draft id',
  navigatingToEditor: 'import: navigating to the editor',
  editorMounted: 'import: editor mounted with a draft id',
  draftFetchStarted: 'import: draft fetch started',
  draftFetchOk: 'import: draft fetch returned a draft',
  draftFetchFailed: 'import: draft fetch failed',
  editorReady: 'import: editor showing the resumed draft',
} as const;
