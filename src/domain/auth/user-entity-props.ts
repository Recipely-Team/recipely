import type { Email } from '@domain/common/email';
import type { CreatorClaim } from '@domain/creators/creator-claim';

export interface UserEntityProps {
  id: string;
  email: Email;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  /** The user's own creator claim; absent or `null` when there is none. */
  creatorClaim?: CreatorClaim | null;
}
