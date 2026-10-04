import type { CreatorTagDto } from '@infrastructure/creators/dtos/creator-tag-dto';

// Wire shape of one of the signed-in user's own claims — an entry of
// `UserDto.creatorTags` / `MyProfileDto.creatorTags` and the `PUT /me/creator`
// answer. `status` is `pending` | `approved` | `rejected`; a platform with no
// claim has no entry.
export interface CreatorClaimDto extends CreatorTagDto {
  status: string;
}
