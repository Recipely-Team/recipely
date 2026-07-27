import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Sizes of things the user taps or types into — buttons, inputs, chips, rows,
 * checkboxes, tab bars.
 *
 * NAMING: role names, not t-shirt steps. A control size is chosen by what the
 * control *is*, and two controls that happen to share a number today (a button
 * and an input are both 52) must still be able to diverge tomorrow without
 * dragging the other with them.
 *
 * ORDER: strictly ascending by value, and a test enforces it. The ordering is
 * what makes a role-named list reviewable — a new entry has exactly one
 * correct place, and putting it there forces you to notice the neighbour that
 * already covers the size you were about to add.
 *
 * USE THESE AS `minHeight`, NOT `height`, wherever the control contains text.
 * A fixed height clips its own label the moment the label wraps, the locale
 * changes, or the OS font scale goes up; `minHeight` keeps the resting size
 * identical and lets the box grow only when it must.
 */
export const controlSizes = {
  /** Thin indeterminate progress bar. */
  progressBarThin: scale(3),
  /** Standard progress bar. */
  progressBar: scale(6),
  /** Compact consent checkbox. */
  checkboxSm: scale(22),
  /** Circular remove/close button overlaid on a media tile. */
  mediaRemoveBtn: scale(22),
  /** Standard checkbox. */
  checkbox: scale(24),
  /** Filter / selection chip. */
  chip: scale(30),
  /** Small round icon button. */
  iconBtnSm: scale(32),
  /** Segmented selector track. */
  selector: scale(34),
  /** The default round icon button (nav bar, card actions). */
  iconBtn: scale(36),
  /** Icon/action button in the web header. */
  webHeaderBtn: scale(38),
  /** Close button on a web modal. */
  webModalClose: scale(38),
  /** Floating circular action on a header or card. */
  floatingBtn: scale(40),
  /** Slim search field inside the web header, tighter than {@link searchBar}. */
  searchBarSlim: scale(40),
  /** "Edit profile" style secondary action. */
  editBtn: scale(42),
  /** Web sort/filter trigger button. */
  webSortBtn: scale(42),
  /** Search field and inline pill actions. */
  searchBar: scale(44),
  /** Round channel chip in the share sheet. */
  channelChip: scale(44),
  /** Compact single-line form input. */
  inputSm: scale(46),
  /** Secondary / sheet button. */
  buttonSm: scale(48),
  /** Extended (labelled) FAB. */
  fabExtended: scale(48),
  /** Hero call-to-action on the web home. */
  heroActionBtn: scale(50),
  /** The primary button. */
  button: scale(52),
  /** The standard text input. */
  input: scale(52),
  /** A settings list row. */
  settingsRow: scale(52),
  /** Circular FAB. */
  fab: scale(56),
  /** Bottom tab bar. */
  tabBar: scale(56),
  /** Short multi-line free-text field. */
  textArea: scale(60),
  /** Minimum width of the compact "Save" action. */
  saveBtnMinWidth: scale(72),
  /** Width of the two-segment language selector. */
  languageSelectorWidth: scale(100),
  /** Multi-line AI prompt field. */
  promptInput: scale(110),
  /** Multi-line message field — a bio, a support message, a long note. */
  messageField: scale(112),
  /** Minimum width of a docked timer chip. */
  timerChipMinWidth: scale(150),
  /** Maximum width of a docked timer chip, past which its name truncates. */
  timerChipMaxWidth: scale(210),
} as const;
