/**
 * Share of the avatar's diameter that its initials are typeset at.
 *
 * A ratio rather than a size because the avatar is drawn at nine different
 * diameters (`avatarSizes`), and two letters have to fill the same proportion
 * of the circle at every one of them — a fixed font size would swim inside the
 * profile avatar and overflow the byline one.
 *
 * Lives beside the widget that applies it: nothing else in the app has an
 * opinion about how large initials sit inside a circle, and a value only one
 * component reads is not cross-cutting.
 */
export const AVATAR_INITIALS_FONT_RATIO = 0.36;
