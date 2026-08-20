/**
 * How the assistant moves this screen.
 *
 * A step is just under a viewport so a sliver of the previous screen stays
 * visible — losing the reader's place between steps is the long-standing
 * complaint about page-down keys, and it matters more here than in a feed
 * because the reader is following instructions in order.
 */
export const DETAIL_SCROLL_STEP_SHARE = 0.85;

/**
 * How often the scroll offset is sampled. It only feeds the assistant's
 * relative steps, so a coarse rate is right: this handler runs on every frame
 * of every scroll the user makes with their thumb.
 */
export const SCROLL_EVENT_THROTTLE_MS = 100;
