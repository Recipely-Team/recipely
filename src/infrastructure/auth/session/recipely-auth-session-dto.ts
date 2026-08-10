import type { RecipelyUserDto } from '@infrastructure/auth/dtos/recipely-user-dto';

export interface RecipelyAuthSessionDto {
  token: string;
  user: RecipelyUserDto;
}
