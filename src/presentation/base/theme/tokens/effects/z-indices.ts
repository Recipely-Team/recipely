/**
 * The app's stacking order, in one place.
 *
 * Stacking is the one style value that cannot be reasoned about locally: a
 * `zIndex: 100` written inside a widget is a claim about every other layer in
 * the app, and the only way to check it was to grep. Listing the layers here,
 * ascending, makes the claim reviewable — a new overlay picks the neighbour it
 * belongs above rather than inventing a number and hoping it wins.
 *
 * Gaps between steps are deliberate: they leave room to slot a layer in
 * without renumbering the ones above it.
 */
export const zIndices = {
  /** Sibling lift inside a single component (a label over its own input). */
  raised: 1,
  /** Collapsing / sticky section header inside a scroll view. */
  stickyHeader: 20,
  /** Floating action button over page content. */
  floatingAction: 30,
  /** The web shell's app header. */
  appHeader: 50,
  /** Docked active-timers bar. */
  timersBar: 100,
  /** Transient toasts — above every page chrome, below modal takeovers. */
  toast: 150,
  /** Full-screen alarm takeover. */
  alarmOverlay: 200,
  /** Launch splash — nothing may cover it. */
  splash: 300,
} as const;
