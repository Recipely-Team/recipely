import { scrollThrottleMs } from '@presentation/base/constants';
import {
  AssistantScrollDirection,
  type AssistantScrollDirectionType,
} from '@presentation/base/hooks/assistant/args/assistant-scroll-direction';
import { ValueConstants } from '@core/constants';

/**
 * How much of the viewport one assistant scroll step moves.
 *
 * Just under a full screen on purpose: moving exactly one viewport leaves no
 * overlap, so the reader loses their place between steps — the long-standing
 * complaint about page-down keys. A sliver of the previous screen stays
 * visible to anchor them, and it matters most where the reader is following
 * instructions in order.
 */
export const SCROLL_STEP_SHARE = 0.85;

/**
 * How often a screen samples its scroll offset for the assistant.
 *
 * Left unthrottled the handler runs on every frame of every scroll the user
 * makes with their thumb, and all it feeds is the starting point of a relative
 * step — a tenth of a second is more than accurate enough for that.
 */
export const SCROLL_EVENT_THROTTLE_MS = scrollThrottleMs.coarse;

/**
 * Where a scroll in this direction should land.
 *
 * @remarks
 * - **The arithmetic, once.** The feed, the recipe detail and every list that
 *   registers {@link useAssistantScrollable} were each spelling out the same
 *   four-branch ternary and their own copy of the step share — three chances
 *   for "go back to the top" to mean something different on one screen.
 * - **`bottom` is a number no content reaches**, which both scrollers clamp to
 *   the end. Measuring the real content height would need a layout pass the
 *   caller has no reason to keep.
 */
export function scrollTargetFor(
  direction: AssistantScrollDirectionType,
  currentOffset: number,
  viewportHeight: number,
): number {
  const step = viewportHeight * SCROLL_STEP_SHARE;

  if (direction === AssistantScrollDirection.Top) return ValueConstants.zero;
  if (direction === AssistantScrollDirection.Bottom) return Number.MAX_SAFE_INTEGER;
  if (direction === AssistantScrollDirection.Up) {
    return Math.max(ValueConstants.zero, currentOffset - step);
  }
  return currentOffset + step;
}
