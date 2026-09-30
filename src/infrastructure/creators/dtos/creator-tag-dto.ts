// Wire shape of a public creator tag — `UserProfileDto.creator` and each
// `GET /users/creators` item's `creator` (docs/creator-tag-contract.md).
// `platform` is read as a plain string: a platform this build does not know
// maps to "no tag" instead of failing the response.
export interface CreatorTagDto {
  platform: string;
  handle: string;
}
