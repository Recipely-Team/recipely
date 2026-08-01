import type { Email } from '@domain/common/email';
export interface UserEntityProps {
  id: string;
  email: Email;
  displayName: string;
  photoUrl?: string;
  bio?: string;
}
