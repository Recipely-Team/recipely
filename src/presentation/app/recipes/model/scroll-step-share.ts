/**
 * How much of the viewport one assistant scroll step moves.
 *
 * Just under a full screen on purpose: moving exactly one viewport leaves no
 * overlap, so the reader loses their place between steps — the long-standing
 * complaint about page-down keys. A sliver of the previous screen stays visible
 * to anchor them.
 */
export const SCROLL_STEP_SHARE = 0.85;
