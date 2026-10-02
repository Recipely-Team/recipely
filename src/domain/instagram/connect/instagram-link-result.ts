import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { CreatorTagOutcomeType } from '@domain/instagram/connect/creator-tag-outcome';

/** The answer to finishing a login: the new connection and what became of the creator tag. */
export interface InstagramLinkResult {
  readonly connection: InstagramConnection;
  readonly creatorTag: CreatorTagOutcomeType;
}
