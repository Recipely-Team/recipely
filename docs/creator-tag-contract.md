# Creator tags — contract

A user who publishes recipes can claim their Instagram account, their TikTok
account, or both. Each platform is reviewed on its own: an admin approves or
rejects one platform's claim, and only an approved claim's tag shows. A user
with at least one approved platform is a creator; approved creators with at
least one published recipe are listed on the Chefs tab (`/creators`), and their
profile page is public.

The backend (`recipely-backend`, PR #370) and the app implement the same shapes
below. Change them in both, in the same release.

## Vocabulary

| Name | Values |
|---|---|
| `CreatorPlatform` | `instagram`, `tiktok` |
| Claim `status` | `pending`, `approved`, `rejected` |

There is no `none` status on the wire: a platform with no claim simply has no
entry. A user holds at most one claim per platform.

**Handle rules** (both sides validate; the backend is the authority):

- Surrounding whitespace and a leading `@` are stripped, then the handle is lowercased.
- Only `a-z`, `0-9`, `.` and `_`.
- Instagram: 1–30 characters. TikTok: 2–24 characters.
- Must not start or end with `.`, and must not contain `..`.

Handles may differ per platform (`@mertmutfakta` on Instagram, `@mert.mutfakta` on TikTok).

Error keys (backend `failureToHttp` → app `failureContent`):
`errors.validation.creator_handle` (bad handle), `errors.validation.content_blocked`
(the moderator refused the handle), `errors.conflict.creator_handle_taken` (another
approved user holds the same platform + handle), `errors.not_found.user`.

An unknown `platform` is refused by request validation with the generic `400` validation
error, not a creator key.

## Shapes

```ts
// The owner's view, status included.
type CreatorTagDto = { platform: CreatorPlatform; handle: string; status: 'pending' | 'approved' | 'rejected' };
// The public view: approved claims only, no status.
type PublicCreatorTagDto = { platform: CreatorPlatform; handle: string };
```

Every list below is ordered Instagram → TikTok, holds at most one entry per
platform, and is never `null`. Each replaces the single `creator` field of the
first version of this contract.

| Carried by | Field |
|---|---|
| `UserDto` — login, register, social login, refresh, `PATCH /me/profile`, avatar upload | `creatorTags: CreatorTagDto[]` |
| `MyProfileDto` — `GET /me` | `creatorTags: CreatorTagDto[]` |
| `UserProfileDto` — `GET /users/:id` (optional auth) | `creatorTags: PublicCreatorTagDto[]` (`[]` = not a creator) |
| `CreatorListItemDto` — `GET /users/creators` | `creatorTags: PublicCreatorTagDto[]` (never empty) |

## Endpoints

### `PUT /me/creator` (auth)

Body `{ platform: CreatorPlatform, handle: string }`. Answers `200` with that
platform's `CreatorTagDto` only; the other platform's claim is untouched.

- The handle is normalised (`@` stripped, trimmed, lowercased).
- The same handle as that platform's approved claim → a no-op that stays `approved`.
- A new handle, or a resubmission after a rejection → `pending`.
- Errors: `400 errors.validation.creator_handle`, `400 errors.validation.content_blocked`,
  `400` request validation, `404 errors.not_found.user`, `409 errors.conflict.creator_handle_taken`, `401`.

### `DELETE /me/creator/:platform` (auth)

Clears that platform's claim, whatever its status. `204`, idempotent. The old
`DELETE /me/creator` is gone (`404`).

### `GET /users/creators?page&pageSize` (optional auth)

Approved creators who have at least one published, approved recipe, and who
are not deleted or suspended. Ordered by follower count desc, then published
recipe count desc, then id. `pageSize` defaults to 20 and is capped at 50.
Registered before `/users/:id`.

```ts
PageResult<{
  id: string;
  displayName: string;
  photoUrl: string | null;
  creatorTags: PublicCreatorTagDto[]; // never empty
  recipeCount: number;                // published + approved
  followerCount: number;
}>
// PageResult = { items, total, page, pageSize }
```

### `GET /users/:id` and `GET /users/:id/recipes` (optional auth)

Guests can open a creator's page. For a guest, `isFollowedByMe` is `false`.

## Notifications (feed and push)

| `type` | When |
|---|---|
| `creator_approved` | An admin approved one platform's claim. |
| `creator_rejected` | An admin rejected one platform's claim. |

`sourcePlatform` is the **lower-case** creator platform (`instagram` / `tiktok`)
and `sourceHandle` the claimed handle; `recipeId`, `senderId`, `commentId`,
`draftId` and `message` are `null`. An `import_done` carries an **upper-case**
`sourcePlatform` (`INSTAGRAM`), so a reader switches on `type` first.

## Admin (AdminJS)

Approve and reject happen per platform claim, in AdminJS only. Approve fails
with `creator_handle_taken` when another approved user holds the same platform +
handle.

## App surfaces (Recipely Prototype, design-spec.md → Creators + Recipely Kitchen)

- **Edit Profile → Creator account:** one card — the intro, a row per claimed
  platform (status pill, what review said, Withdraw / Unlink / Try again), and a
  "Link {Platform} account" row per unclaimed platform, which opens the handle
  form in its place. One form at a time; no platform picker.
- **Chefs tab** (`/creators`): card grid; each card shows one handle line per
  verified account.
- **Creator profile** (`/creators/[userId]`): one linked badge per verified
  platform, wrapping. Public, so it is in the sitemap (rule 23f) and analytics (rule 25).
- **Avatar seals:** one seal per verified account, overlapped when there are two,
  Instagram in front.
- **Profile tab:** one approved badge beside the name once any platform is approved.
- **Notifications:** `creator_approved` / `creator_rejected` rows name the platform,
  with the handle on the line under it.
