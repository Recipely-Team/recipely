import { scale, scaleFont } from '@presentation/base/theme/tokens/scale';

/**
 * The weekly meal planner's measurements (design spec → Meal planner, from the
 * Claude Design prototype). Shared spacing, radii and type sizes come from the
 * general tokens; these are the planner's own shapes.
 *
 * @remarks
 * - **Web-grid widths are not scaled**: they are CSS pixels the 1200 px
 *   container is laid out in, like `diarySizes.railWidth`.
 */
export const mealPlanSizes = {
  modeSegment: scale(38),
  modeSegmentWeb: scale(34),
  modeSwitchWebWidth: 200,
  thisWeekChip: scale(26),
  weekRange: scaleFont(15),
  weekRangeWeb: scaleFont(17),
  stripDay: scale(66),
  kcalBar: scale(4),
  kcalBarHead: scale(6),
  kcalBarStripWidth: '70%',
  dayHeadValue: scaleFont(15),
  overText: scaleFont(12.5),
  slotTitle: scaleFont(16),
  addChip: scale(32),
  emptySlotMin: scale(52),
  plannedThumb: scale(56),
  plannedThumbRadius: scale(10),
  plannedTitle: scaleFont(14.5),
  stepper: scale(32),
  stepperWeb: scale(26),
  stepperText: scaleFont(12.5),
  stepperTextWeb: scaleFont(11.5),
  /** Grows a 32 pt stepper button to the 44 pt touch target. */
  stepperHitSlop: scale(6),
  menuButtonWidth: scale(44),
  menuButtonHeight: scale(36),
  kcalUnit: scaleFont(11.5),
  eatenBadge: scale(22),
  eatenTag: scale(22),
  gridHeadColumn: 84,
  gridColumnMin: 128,
  gridMinWidth: 1036,
  gridGap: 8,
  gridDate: scaleFont(20),
  gridCellMin: scale(112),
  gridAdd: scale(30),
  gridThumb: scale(60),
  gridThumbRadius: scale(7),
  gridCardRadius: scale(10),
  gridMenuButton: scale(28),
  gridTitle: scaleFont(12.5),
  emptyTileWidth: scale(30),
  emptyTileHeight: scale(42),
  emptyTileRadius: scale(9),
  emptyTileBlock: scale(14),
  emptyTitle: scaleFont(19),
  emptyBody: scaleFont(14.5),
  emptyBodyMaxWidth: 360,
  cta: scale(48),
  ctaWeb: scale(44),
  ghostWeb: scale(40),
  /** The mobile sticky "Add week to shopping list" bar, added to the list's bottom inset. */
  ctaBarReserve: scale(72),
  lockDisc: scale(56),
  dayButton: scale(54),
  pickRowMin: scale(64),
  pickThumb: scale(48),
  pickPlus: scale(32),
  actionsThumb: scale(52),
  actionRowMin: scale(52),
  stepperValue: scaleFont(17),
  checkboxRadius: scale(7),
  shopRowMin: scale(52),
  addDialogMaxWidth: 520,
  shopDialogMaxWidth: 560,
  /** A loading week shows this many slot placeholders under the day head. */
  skeletonSlots: 3,
} as const;
