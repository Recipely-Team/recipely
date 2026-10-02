/** An edit to a rule — every field optional; the post cannot change (PATCH `/me/instagram/rules/:id`). */
export interface DmRuleChanges {
  readonly keywords?: readonly string[];
  readonly recipeId?: string;
  readonly dmText?: string;
  readonly publicReplyText?: string | null;
  readonly enabled?: boolean;
}
