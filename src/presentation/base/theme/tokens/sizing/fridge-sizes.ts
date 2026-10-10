import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Measurements only "Cook from my fridge" draws — its flow screen, the mode
 * cards on the AI create screen and the camera shortcut beside the Recipes
 * AI banner (design spec → Cook from my fridge).
 *
 * @remarks
 * - **Its own module, not rungs on the shared ladders**, for the reason
 *   `diarySizes` gives: a 26pt missing-item chip is a decision about this
 *   flow, not a step another screen would reach for.
 * - **Device-scaled** like the other sizing modules, except the idea card's
 *   minimum width, which is a property of the viewport grid.
 */
export const fridgeSizes = {
  modeCardMinHeight: scale(84),
  bannerCamera: scale(50),
  bannerWebButton: scale(46),
  cameraDisc: scale(64),
  removeDisc: scale(28),
  analysingTile: scale(110),
  progressSegment: scale(4),
  meterSegment: scale(5),
  chip: scale(40),
  chipExpanded: scale(36),
  missingChip: scale(26),
  addInputWidth: scale(130),
  ideaTile: scale(44),
  ideaCardMinWidth: 260,
} as const;
