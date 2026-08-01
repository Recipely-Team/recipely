/**
 * True when an ingredient line is a GROUP HEADING rather than an ingredient.
 *
 * A recipe made of separate components — a dessert's syrup, a cake's filling,
 * a marinade — reads as one flat list unless its parts are named. Rather than
 * add a nested shape to every layer (wire DTO, draft snapshot, AI response,
 * editor state), a heading rides inside the existing `string[]` marked by a
 * leading `#`, the way Markdown marks one. Old recipes stay valid, nothing
 * needs migrating, and a client that does not know about groups still shows
 * every ingredient — just with a stray `#`.
 *
 * The cost of that choice is this predicate: every place that counts,
 * validates, parses or renders an ingredient has to ask first.
 */
export const isIngredientGroup = (line: string): boolean => line.trimStart().startsWith('#'); // TO DO: static char problem
