/**
 * The marker that turns an ingredient line into a group heading, with the
 * space the label follows. Written once here so the editor, the mappers and
 * the tests all agree on what a heading looks like on the wire.
 */
/** The character that turns an ingredient line into a heading. */
export const INGREDIENT_GROUP_MARKER = '#';

/** What the editor writes when a group is added: the marker plus its separating space. */
export const INGREDIENT_GROUP_PREFIX = `${INGREDIENT_GROUP_MARKER} `;
