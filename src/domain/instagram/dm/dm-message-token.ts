/** The placeholders a DM may carry: the commenter's name and the recipe link. Also the wire spelling. */
export const DmMessageToken = {
  Name: '{name}',
  Link: '{link}',
} as const;

export type DmMessageTokenType = (typeof DmMessageToken)[keyof typeof DmMessageToken];
