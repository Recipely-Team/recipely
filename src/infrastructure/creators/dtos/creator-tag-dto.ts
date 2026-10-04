// Wire shape of a public (approved) creator tag — an entry of
// `UserProfileDto.creatorTags` and of each `GET /users/creators` item's
// `creatorTags` (docs/creator-tag-contract.md).
// `platform` is read as a plain string: a platform this build does not know
// maps to "no tag" instead of failing the response.
export interface CreatorTagDto {
  platform: string;
  handle: string;
}
