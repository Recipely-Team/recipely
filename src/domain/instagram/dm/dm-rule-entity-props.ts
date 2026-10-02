import type { DmRuleMedia } from '@domain/instagram/dm/dm-rule-media';
import type { DmRuleRecipe } from '@domain/instagram/dm/dm-rule-recipe';

export interface DmRuleEntityProps {
  id: string;
  mediaId: string;
  media: DmRuleMedia;
  keywords: readonly string[];
  recipeId: string;
  /** Null when the recipe is gone or no longer readable. */
  recipe: DmRuleRecipe | null;
  dmText: string;
  publicReplyText: string | null;
  enabled: boolean;
  sentCount: number;
  createdAt: Date;
}
