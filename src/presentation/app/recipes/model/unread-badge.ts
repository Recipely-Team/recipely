/**
 * How the unread-notification badge behaves once the count gets large.
 *
 * A two-digit count widens the badge past the circle it is drawn in, and the
 * exact number stops being the point once it is "a lot". Both the mobile and
 * the web header of this page render the badge, and each had the threshold
 * written out.
 */
export const UNREAD_BADGE_MAX = 9;

/** What the badge shows once the count passes {@link UNREAD_BADGE_MAX}. */
export const UNREAD_BADGE_OVERFLOW_LABEL = '9+';
