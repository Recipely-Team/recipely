import { spacing } from '@presentation/base/theme';

/**
 * How far the mobile content card is pulled up over the bottom of the hero.
 *
 * @remarks
 * - **Two places have to agree.** `MobileRecipeDetail` spends it as a negative
 *   `marginTop`, and `MediaGallery` spends it lifting the owner controls clear
 *   of what that margin covers. Written twice they drifted, and the drift is
 *   invisible: the card is opaque, so the control it buries looks like a
 *   control that was never drawn.
 * - **Why the controls care at all.** The card is a later sibling, so it paints
 *   AND hit-tests above the hero. Anything inside the overlap is not merely
 *   hard to see — it cannot be pressed.
 */
export const mobileContentOverlap = spacing.xxl;
