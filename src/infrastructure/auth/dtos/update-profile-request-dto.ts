// Body of `PATCH /me/profile`. Both fields optional: the edit screen sends
// only what the user actually changed.
export interface UpdateProfileRequestDto {
  displayName?: string;
  bio?: string;
}
