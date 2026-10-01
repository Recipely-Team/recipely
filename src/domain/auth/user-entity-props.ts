import type { Email } from '@domain/common/email';
import type { CreatorClaims } from '@domain/creators/creator-claims';

export interface UserEntityProps {
  id: string;
  email: Email;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  /** The user's own creator claims, one per platform; absent when there are none. */
  creatorClaims?: CreatorClaims;
}
