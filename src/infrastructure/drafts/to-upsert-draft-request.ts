import type { RequestMapper } from '@core/mapper/request-mapper';
import type { UpsertDraftInput } from '@domain/drafts/upsert-draft-input';
import type { UpsertDraftRequestDto } from '@infrastructure/drafts/dtos/upsert-draft-request-dto';

/** Domain input -> `PUT /recipes/drafts/:id` body; the id goes in the path. */
export const toUpsertDraftRequest: RequestMapper<UpsertDraftInput, UpsertDraftRequestDto> = (
  input,
) => ({
  prompt: input.prompt,
  snapshot: input.snapshot,
  chatHistory: input.chatHistory,
});
