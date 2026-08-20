/**
 * How far a recipe card rises when the pointer enters it.
 *
 * Shared by the two cards that have a hover state at all — the feed card and
 * the web grid card — because a lift that differs between them reads as one of
 * the two being broken when both are on screen at once. The matching duration
 * is `durations.hover`.
 *
 * Hover is a web-only affordance; both call sites are behind `isWeb()`.
 */
export const CARD_HOVER_LIFT = 1.02;
