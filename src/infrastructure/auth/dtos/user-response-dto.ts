import type { RecipelyUserDto } from '@infrastructure/auth/dtos/recipely-user-dto';

// Wire shape of the endpoints that answer with the caller's own user and
// nothing else (`PATCH /me/profile`). Named rather than written inline at the
// call site so the envelope is as visible as the payload it wraps.
export interface UserResponseDto {
  user: RecipelyUserDto;
}
