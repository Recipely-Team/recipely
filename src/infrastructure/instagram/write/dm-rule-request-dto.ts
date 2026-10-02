// Body of `POST /me/instagram/rules` (every field) and `PATCH …/:id` (only what
// changes; `mediaId` never).
export interface DmRuleRequestDto {
  mediaId?: string;
  keywords?: string[];
  recipeId?: string;
  dmText?: string;
  publicReplyText?: string | null;
  enabled?: boolean;
}
