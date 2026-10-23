import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';

/** The title size for a recipe name: the first tier whose `maxChars` the name fits. */
export const shareCardNameTier = (
  name: string,
): (typeof ShareCardLayout.nameTiers)[number] | typeof ShareCardLayout.longNameTier =>
  ShareCardLayout.nameTiers.find((tier) => name.length <= tier.maxChars) ?? ShareCardLayout.longNameTier;
