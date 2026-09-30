import type { CreatorPlatformType } from '@domain/creators/creator-platform';

// `PUT /me/creator` body: the account the user claims, handle already normalised.
export interface CreatorTagRequestDto {
  platform: CreatorPlatformType;
  handle: string;
}
