// One comment-to-DM rule. Keep in sync with recipely-backend `dm-rule.dto.ts`.
export interface DmRuleDto {
  id: string;
  mediaId: string;
  media: { permalink: string | null; thumbnailUrl: string | null; caption: string | null };
  keywords: string[];
  recipeId: string;
  recipe: { id: string; name: string; image: string | null } | null;
  dmText: string;
  publicReplyText: string | null;
  enabled: boolean;
  sentCount: number;
  createdAt: string;
  updatedAt: string;
}
