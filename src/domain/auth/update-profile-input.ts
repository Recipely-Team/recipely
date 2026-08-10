/**
 * The editable part of a user's own profile.
 *
 * A domain input rather than a wire shape: the port declares it, so both the
 * repository and every caller agree on what "updating a profile" means without
 * restating the fields. Both optional — the edit screen sends only what the
 * user actually changed.
 */
export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
}
