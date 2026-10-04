/** Where the product step's product comes from: a listed row (its variants are fetched) or something logged before. */
export const ProductChoiceKind = {
  Listed: 'listed',
  Logged: 'logged',
} as const;

export type ProductChoiceKindType = (typeof ProductChoiceKind)[keyof typeof ProductChoiceKind];
