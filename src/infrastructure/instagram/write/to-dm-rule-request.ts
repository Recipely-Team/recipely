import type { RequestMapper } from '@core/mapper/request-mapper';
import type { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import type { DmRuleRequestDto } from '@infrastructure/instagram/write/dm-rule-request-dto';

/** A validated draft → `POST /me/instagram/rules` body; new rules start on. */
export const toDmRuleRequest: RequestMapper<DmRuleDraft, DmRuleRequestDto> = (draft) => ({
  mediaId: draft.mediaId,
  keywords: [...draft.keywords],
  recipeId: draft.recipeId,
  dmText: draft.dmText,
  publicReplyText: draft.publicReplyText,
  enabled: true,
});
