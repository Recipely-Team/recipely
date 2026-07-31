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
}
