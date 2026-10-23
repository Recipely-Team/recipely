import type { RecipelyUserDto } from '@infrastructure/auth/dtos/recipely-user-dto';

export interface RecipelyAuthSessionDto {
  token: string;
  /** Absent from servers before refresh tokens, and on web, where it travels as a cookie. */
  refreshToken?: string;
  user: RecipelyUserDto;
}
