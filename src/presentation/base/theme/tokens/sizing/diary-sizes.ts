import { scale, scaleFont } from '@presentation/base/theme/tokens/scale';

/**
 * Measurements only the food diary draws — the Diary tab, its calendar, the
 * Add food and Daily goals sheets and Recipe Detail's "Add to diary" button
 * (design spec → Food Diary).
 *
 * @remarks
 * - **Its own module, not rungs on the shared ladders.** A calorie ring or a
 *   62pt date cell is a decision about the diary, not a step on a scale
 *   another screen would reach for, and slotting them into `controlSizes`
 *   would make those ladders read as the diary's.
 * - **Device-scaled** like the other sizing modules, except the rail and the
 *   two-column breakpoints, which are properties of the viewport.
 */
export const diarySizes = {
  ringValueMobile: scaleFont(28),
  sheetTotal: scaleFont(36),
  pageTitleWeb: scaleFont(28),
  ringMobile: scale(128),
  ringStrokeMobile: scale(12),
  ringWeb: scale(156),
  ringStrokeWeb: scale(14),
  summaryStatsMinWidth: scale(140),
  macroBar: scale(6),
  macroBarRadius: scale(3),
  macroGapRow: scale(14),
  macroGapColumn: scale(18),
  waterDisc: scale(36),
  waterPillWidth: scale(18),
  waterPillHeight: scale(6),
  marker: scale(10),
  markerStrip: scale(12),
  entryDot: scale(4),
  dayCell: scale(62),
  monthCell: scale(52),
  railCell: scale(44),
  dayCellGap: scale(6),
  railCellGap: scale(4),
  todayUnderline: 2,
  todayPill: scale(26),
  foodThumb: scale(44),
  foodThumbLarge: scale(52),
  foodThumbRadius: scale(10),
  monthCellRadius: scale(10),
  itemRowMinHeight: scale(64),
  emptyMealMinHeight: scale(52),
  pickRowMinHeight: scale(60),
  /** The pick step's list area never shrinks below this, so the sheet does not jump while searching. */
  pickBodyMinHeight: scale(360),
  pickSkeletonRows: 5,
  pickSkeletonBar: scale(10),
  pickSkeletonWide: '58%',
  pickSkeletonNarrow: '36%',
  pickMessageCircle: scale(48),
  draftTagMinHeight: scale(16),
  draftTagRadius: scale(6),
  unitChipMinHeight: scale(40),
  unitChipMinHeightWeb: scale(36),
  amountValueMinWidth: scale(96),
  radioOuter: scale(20),
  radioDot: scale(10),
  radioRing: 2,
  variantRowMinHeight: scale(44),
  /** Up to this many variants show as a segmented control; more as a radio list. */
  variantSegmentsMax: 4,
  segmentHeight: scale(38),
  goalInputWidth: scale(104),
  /** The meal confirm list's grams box. */
  mealGramsFieldWidth: scale(104),
  legendSwatch: scale(22),
  legendColumnMin: scale(150),
  welcomeTile: scale(44),
  mealGap: scale(14),
  scrollBottomPad: scale(120),
  swipeThreshold: 40,
  railWidth: 380,
  webColumnsMin: 1020,
  webMealColumnsMin: 1180,
  webPaddingTop: 28,
  webPaddingBottom: 64,
  addFoodDialogMaxWidth: 520,
  goalsDialogMaxWidth: 480,
} as const;
