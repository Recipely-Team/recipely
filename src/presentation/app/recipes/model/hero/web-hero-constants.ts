/**
 * rgba overlay constants for the web home hero cards. These cannot live in
 * `ThemeColors` (typed `string`, but semantically alpha overlays that must be
 * identical across variants), so they are feature-scoped constants per the web
 * home redesign spec. They are NOT API/storage keys, so they do not belong in
 * `infrastructure/constants/`.
 */

/** Darkest stop of the hero diagonal gradient (0% anchor, bottom-left). */
export const HERO_OVERLAY_DEEP = 'rgba(15,23,42,0.9)';
/** Mid stop (45%) of the hero diagonal gradient. */
export const HERO_OVERLAY_MID = 'rgba(15,23,42,0.55)';
/** Fade stop (80–100%) of the hero gradient — no text sits here. */
export const HERO_OVERLAY_FADE = 'rgba(15,23,42,0.05)';
/** Translucent frosted background for the hero "Save" button. */
export const HERO_SAVE_BG = 'rgba(255,255,255,0.14)';
