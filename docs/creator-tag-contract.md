# Creator tag — contract

A user who publishes recipes can claim their Instagram or TikTok account. An
admin approves the claim; only then does the tag show. Approved creators with
at least one published recipe appear in the "Creators" strip on Explore, and
their profile page is public.

The backend (`recipely-backend`) and the app implement the same shapes below.
Change them in both, in the same release.

## Vocabulary

| Name | Values |
|---|---|
| `CreatorPlatform` | `instagram`, `tiktok` |
| `CreatorStatus` | `none`, `pending`, `approved`, `rejected` |

**Handle rules** (both sides validate; the backend is the authority):

- A leading `@` is stripped, then the handle is lowercased.
- Only `a-z`, `0-9`, `.` and `_`.
- Instagram: 1–30 characters. TikTok: 2–24 characters.
- Must not start or end with `.`, and must not contain `..`.

Error keys (backend `failureToHttp` → app `failureContent`):
`errors.validation.creator_handle` (bad handle), `errors.conflict.creator_handle_taken`
(another approved user holds the same platform + handle), `errors.conflict.creator_not_pending`
(an admin approve or reject of a claim that is no longer pending).

An unknown `platform` is refused by request validation with the generic `400` validation
error, not a creator key; only a bad handle answers `errors.validation.creator_handle`.

## Endpoints

### The owner's claim: `UserDto` and `GET /me`

The owner's view of the claim, status included:

```ts
creator: { platform: CreatorPlatform; handle: string; status: 'pending' | 'approved' | 'rejected' } | null
```

`null` when the status is `none`. It is carried by:

- `UserDto` — the user in the login, social login, `PATCH /me/profile` and avatar upload answers.
- `GET /me` (existing), which answers the **profile shape** (`UserProfileDto`, as it always has),
  not `UserDto`; its `creator` is this owner view, with status.

### `PUT /me/creator` (new, auth)

Body `{ platform: CreatorPlatform, handle: string }`. It sets the claim to `pending` and
`requestedAt` to now, and answers `200` with the same `creator` object as `/me`.

- The same platform + handle as an already-approved claim → a no-op that stays `approved`.
- Any change to an approved claim → back to `pending`: the tag disappears until an admin approves it again.
- Invalid handle → `400 errors.validation.creator_handle`.
- Unknown platform → the generic `400` validation error.
- The content moderator checks the handle like it checks a bio.

### `DELETE /me/creator` (new, auth)

Clears the claim (status `none`, fields null). `204`.

### `GET /users/creators?page&pageSize` (new, optional auth)

Approved creators who have at least one published, approved recipe, and who are
not deleted or suspended. Ordered by follower count desc, then published recipe
count desc, then id. `pageSize` defaults to 20 and is capped at 50. Registered
before `/users/:id`.

```ts
PageResult<{
  id: string;
  displayName: string;
  photoUrl: string | null;
  creator: { platform: CreatorPlatform; handle: string };
  recipeCount: number;   // published + approved
  followerCount: number;
}>
// PageResult = { items, total, page, pageSize }
```

### `GET /users/:id` and `GET /users/:id/recipes` (existing → optional auth)

Guests can open a creator's page. For a guest, `isFollowedByMe` is `false`.
`UserProfileDto` gains `creator: { platform: CreatorPlatform; handle: string } | null`,
which is set only when the claim is approved (the public view: no status). `GET /me`
uses the same shape but carries the owner view above instead.

## Admin (AdminJS, User resource)

- `creatorStatus`, `creatorPlatform`, `creatorHandle` and `creatorRequestedAt` appear in the
  list and show views. The list is filterable by `creatorStatus`.
- The record actions **Approve creator** and **Reject creator** are visible only while the
  status is `pending`.
- Approve sets `approved` and `creatorReviewedAt`. It fails with `creator_handle_taken`
  when another approved user holds the same platform + handle.
- Approve or reject of a claim that is not pending fails with `creator_not_pending`.
- Reject sets `rejected` and `creatorReviewedAt`.

## Data

`users` gains the nullable `creator_platform`, `creator_handle`, `creator_requested_at` and
`creator_reviewed_at`, plus `creator_status text not null default 'none'`, indexed by
`creator_status`.

## App surfaces (these wait for the Claude Design prototype — CLAUDE.md rule 28)

- **Edit Profile:** a "Creator account" section. Pick a platform, type the handle, send.
  It shows pending, approved or rejected, and has a remove action.
- **Explore:** a horizontal "Creators" strip above the feed, showing avatar, name and
  platform badge. It is hidden when there are no creators.
- **Creator profile page** (`/creators/[userId]`): header with badge and handle, follow
  button, their recipes. Public, so it goes in the sitemap (rule 23f) and analytics (rule 25).
- **Badge:** a small platform mark next to the name, on the profile and in the strip.
