import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';

// Wire shape of the signed-in user's own claim — `UserDto.creator` and the
// `PUT /me/creator` answer. `status` is `pending` | `approved` | `rejected`;
// `none` travels as `creator: null`.
export interface CreatorClaimDto extends CreatorTagDto {
  status: string;
}
