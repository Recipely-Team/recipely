import type { DragReleaseGesture } from '@presentation/base/utils/drag-release-gesture';

// Gesture-behavior thresholds (not layout metrics, so kept local rather than
// in `theme/spacing.ts` — same convention as e.g. `COPIED_RESET_MS` in
// `recipe-share-sheet.tsx`).
const TAP_SLOP = 4;
const DISMISS_DISTANCE = 90;
const DISMISS_VELOCITY = 0.8;

/**
 * Decides whether a released drag on the bottom-sheet grabber should dismiss
 * the sheet. True when the release barely moved (treated as a tap, so the
 * grabber stays a single-touch dismiss control) or the downward drag cleared
 * `DISMISS_DISTANCE` px or `DISMISS_VELOCITY` px/ms; false otherwise, in
 * which case the caller should snap the sheet back to its resting position.
 */
export const shouldDismissDrag = (gesture: DragReleaseGesture): boolean => {
  const isTap = Math.abs(gesture.dx) < TAP_SLOP && Math.abs(gesture.dy) < TAP_SLOP;
  const doesClearThreshold = gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY;
  return isTap || doesClearThreshold;
};
