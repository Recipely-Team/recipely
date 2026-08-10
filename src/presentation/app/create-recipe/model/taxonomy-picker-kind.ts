/** Which taxonomy the picker sheet is choosing from. */
export const TaxonomyPickerKind = {
  Cuisine: 'cuisine',
  Category: 'category',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type TaxonomyPickerKind = (typeof TaxonomyPickerKind)[keyof typeof TaxonomyPickerKind];
