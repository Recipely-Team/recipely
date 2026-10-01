export interface ResolvedAuthor {
  authorName: string;
  authorPhotoUrl?: string;
  recipeCount: number;
  isOwner: boolean;
  /** Recipely Kitchen wrote it: shown with the logo and a verified check, without a recipe count. */
  isKitchen?: boolean;
}
