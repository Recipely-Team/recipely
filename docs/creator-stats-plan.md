# Creator stats — plan

**Status:** v1 `building` · v2, v3 `idea` (see [roadmap §12](roadmap.md#12-creator-stats))

A panel where a creator who runs comment-to-DM automations sees what they bring
in. Instagram's own Insights already shows reach and audience; repeating it
would give nobody a reason to open Recipely. The panel shows what only Recipely
knows — the road from a comment on Instagram to a recipe opened and saved here —
and the follower trend over time, which Instagram's app only shows as a total.

## v1 — no new Instagram permission

Everything below runs on `instagram_business_basic` + the comment/message
permissions automations already need. It does not wait on Meta App Review.

### What the creator sees

- **Summary for a range** (7 / 30 / 90 days): comments matched → DMs sent →
  recipe opened → recipe saved, each with the step-to-step rate.
- **Follower trend** from our own daily snapshot, with the change over the range.
- **Per post** (one row per automated post): thumbnail, keywords, sent, opened,
  saved, open rate. Sorted by opens.
- Empty and low-data states: no automations yet, automations but no sends yet,
  snapshots shorter than the range ("tracking since 10 Oct").

### What the backend adds

| Piece | Shape |
|---|---|
| Open tracking | The DM link becomes `/recipes/<id>?dm=<sendId>`. `POST /instagram/dm-sends/:id/opened` (public, idempotent, rate-limited) stamps `DmSend.openedAt` the first time. The send id is a UUID, so it cannot be guessed. |
| Save attribution | The client remembers the `dm` id it arrived with; saving that recipe sends it along and stamps `DmSend.savedAt` when the recipe matches the rule's. |
| Follower snapshot | `InstagramDailySnapshot(userId, day, followers, mediaCount)`, one row per connected account per UTC day, written by an hourly sweep next to the token refresh. `followers_count` comes from the existing `/me` call. |
| Stats read | `GET /instagram/stats?days=7\|30\|90` → totals, a per-day series (sent / opened / saved), the follower series, and per-rule rows. |

### What the app adds

- The recipe page (web and native) reads `dm`, reports the open once, and keeps
  the id for a save in the same session.
- A stats screen under automations, reached from the automations header and the
  profile's automations row. Designed in Claude Design first (rule 28).

### Deliberately not in v1

- **"Cooked"** — the app records no cook event yet; adding one is its own change.
- Anything that needs `instagram_business_manage_insights` (v2).

## v2 — audience (needs the insights permission)

- Add `instagram_business_manage_insights` to the connect scopes and to the Meta
  App Review submission (same one as comments/messages, see
  [instagram-app-review.md](instagram-app-review.md)).
- Snapshot `follower_demographics` by country / city / age / gender daily
  (top 45 rows per breakdown; needs ≥ 100 followers; up to 48 h late).
- **Compare two dates**: biggest risers and fallers by country, compared only
  over countries present in both snapshots (the 45-row cut makes others look
  like they fell).
- **Engaged audience** for the last 7 / 30 days (`engaged_audience_demographics`,
  `timeframe=this_week|this_month`), stored weekly for week-over-week. Never sum
  two weeks — the same person counts twice and each list is a top-45 sample.
- Instagram has no history for these: comparisons start from the day we first
  snapshot, so start the snapshot the day the permission is granted.

## v3 — later

- Per-post reach / saves / shares from Instagram next to Recipely's funnel.
- Story insights (only readable for 24 h — must be captured live).
- Suggestions from the data ("your audience is growing in the US — try an
  English caption").
- A cook event, so the funnel can end at "cooked".
