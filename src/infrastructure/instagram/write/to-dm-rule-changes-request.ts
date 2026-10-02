import type { RequestMapper } from '@core/mapper/request-mapper';
import type { DmRuleChanges } from '@domain/instagram/dm/dm-rule-changes';
import type { DmRuleRequestDto } from '@infrastructure/instagram/write/dm-rule-request-dto';

/** `DmRuleChanges` → `PATCH /me/instagram/rules/:id` body; unset fields are left out, a cleared reply is sent as null. */
export const toDmRuleChangesRequest: RequestMapper<DmRuleChanges, DmRuleRequestDto> = (changes) => ({
  ...(changes.keywords === undefined ? {} : { keywords: [...changes.keywords] }),
  ...(changes.recipeId === undefined ? {} : { recipeId: changes.recipeId }),
  ...(changes.dmText === undefined ? {} : { dmText: changes.dmText }),
  ...(changes.publicReplyText === undefined ? {} : { publicReplyText: changes.publicReplyText }),
  ...(changes.enabled === undefined ? {} : { enabled: changes.enabled }),
});
