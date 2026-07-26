import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { RecipeDraftDto } from '@infrastructure/drafts/dtos/recipe-draft-dto';

/**
 * Maps a `RecipeDraftDto` from the API into a domain `RecipeDraft`. `snapshot`
 * and `chatHistory` share the wire shape so they pass through verbatim; the
 * ISO `createdAt` / `updatedAt` strings are parsed into `Date`s.
 */
export const toRecipeDraft = (dto: RecipeDraftDto): RecipeDraft => ({
  id: dto.id,
  ownerId: dto.ownerId,
  prompt: dto.prompt,
  snapshot: dto.snapshot,
  chatHistory: dto.chatHistory,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});
