import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';

/** The title size for a recipe name: the first tier whose `maxChars` the name fits. */
export const shareCardNameTier = (name: string): (typeof ShareCardLayout.nameTiers)[number] =>
  ShareCardLayout.nameTiers.find((tier) => name.length <= tier.maxChars) ?? ShareCardLayout.nameTiers[ShareCardLayout.nameTiers.length - 1];
