/** What sits in the middle of the import ring: a dish, a site's globe, or a page. */
export const ImportDish = {
  /** A video's recipe — the platform gradient already says where it came from. */
  Dish: 'dish',
  /** A recipe web page, which has no photo to stand for it. */
  Globe: 'globe',
  /** Photos or a PDF of a written recipe. */
  Document: 'document',
} as const;

export type ImportDishType = (typeof ImportDish)[keyof typeof ImportDish];
