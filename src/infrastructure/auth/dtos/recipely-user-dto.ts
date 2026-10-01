import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';

// Wire shape returned by the Recipely backend /auth/login and /auth/register.
// Matches recipely-backend `application/auth/dtos/auth.dto.ts`.

export interface RecipelyUserDto {
  id: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  bio?: string | null;
  createdAt: string;
  role?: string;
  /** The user's own claims, one per platform, Instagram first; absent from a backend older than per-platform tags. */
  creatorTags?: CreatorClaimDto[];
}
