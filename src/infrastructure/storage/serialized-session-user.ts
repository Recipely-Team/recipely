// The persisted half of a session's user. Split out of `SerializedSession`
// rather than nested inline: it is a stored shape in its own right, and the
// migration risk of a storage format lives in the fields, so they deserve a
// name to be found by.
export interface SerializedSessionUser {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
}
