# Comment-to-DM — creators connect Instagram and auto-send recipes

Roadmap item 9. A creator connects their Instagram professional account inside
Recipely, picks a post or Reel, a keyword and a Recipely recipe; when someone
comments the keyword, Recipely sends that person a private reply with the recipe.
Connecting through Instagram's own login also proves the account is theirs, so the
creator tag can be approved without an admin — which is what fills the Chefs tab.
**This file is the progress board** — when a session ends, work resumes from here.

## Status board

| Phase | Work | Status | PR |
|-------|------|--------|-----|
| 0 | Technical scope (this file) | ✅ done | — |
| 1 | Meta app setup (user) | ⏳ waiting on the user | — |
| 2 | Design in the Claude Design prototype | ⏳ | — |
| 3 | Backend: Instagram Login, tokens, webhooks, rules, sender | ⏳ | — |
| 4 | App: connect, automations list, rule editor, activity | ⏳ | — |
| 5 | Test with app-role accounts (Standard Access) | ⏳ | — |
| 6 | Meta App Review + Business Verification (Advanced Access) | ⏳ | — |

## Platform facts (Instagram API with Instagram Login, checked 2026-10-02)

- **Login:** "Business Login for Instagram" — an OAuth flow on instagram.com that
  returns a token for the user's professional (Business or Creator) account. No
  Facebook Page is needed.
- **Scopes:** `instagram_business_basic` (profile, media list),
  `instagram_business_manage_comments` (read comments, comment webhooks),
  `instagram_business_manage_messages` (send messages, message webhooks). The short
  scope names were retired on 2025-01-27.
- **Private Replies:** one private reply per comment, sent to the commenter by
  comment id, **within 7 days** of the comment (Live: only during the broadcast).
  It lands in their Inbox if they follow the account, otherwise in Requests.
- **24-hour window:** if the commenter answers the DM, a standard 24-hour
  messaging window opens; outside it, nothing else may be sent. No bulk or
  promotional messaging.
- **Webhooks:** the app subscribes to `comments` (and `live_comments`) and
  `messages`; Meta POSTs the comment id, media id, commenter's IG-scoped id and
  username, and the text. Payloads are signed (`X-Hub-Signature-256`) and must be
  verified; the endpoint must answer the verify challenge.
- **Access levels:** Standard Access works only for accounts with a role on the
  Meta app (the user's own account, testers) — enough for phases 3–5. Serving
  other creators needs **Advanced Access**, granted through **App Review** (a
  screencast per permission) and **Business Verification**; Meta quotes 2–4 weeks.
- **Tokens:** long-lived user tokens (~60 days) that must be refreshed before
  expiry; stored encrypted server-side, never on the device.

## What the user must do (phase 1)

1. developers.facebook.com → Create app → type **Business** → add the
   **Instagram** product → "API setup with Instagram login".
2. Add the Instagram professional account as an **Instagram tester** (App roles)
   and accept the invite in Instagram (Settings → Apps and websites → Tester invites).
3. Business Login settings: OAuth redirect URI
   `https://dev-api.recipely.net/auth/instagram/callback` (prod later);
   Webhooks callback `https://dev-api.recipely.net/webhooks/instagram` with a
   verify token we generate.
4. Send the **Instagram App ID** and **App Secret** privately (they go into the
   backend's env, never into the repo or chat logs).
5. Later (phase 6): Business Verification in Business Manager, privacy policy URL
   (`recipely.net/privacy`) and data-deletion URL already exist.

## Design (phase 2) — screens to draw first

- **Edit profile → Creator account:** "Connect with Instagram" (OAuth) next to
  the manual handle claim; connected state shows the account and auto-approves
  the Instagram creator tag.
- **Automations** (from Profile / creator account): list of rules — post
  thumbnail, keyword(s), recipe, on/off, sent count.
- **Rule editor:** pick a post/Reel from the connected account (paged), keywords
  (any/exact), recipe picker (own recipes, paged search), DM text preview with the
  recipe card/link, optional public comment reply.
- **Activity:** recent sends and failures (outside 7 days, user blocked messages).
- Empty, disconnected and token-expired states; TR + EN; mobile + web.

## Backend (phase 3) — outline

- `GET /auth/instagram/start` → redirect; `/auth/instagram/callback` exchanges the
  code, upgrades to a long-lived token, stores it encrypted, links the IG account
  id + username to the user, auto-approves the Instagram creator tag.
- `GET/POST /webhooks/instagram`: verify challenge; HMAC check; enqueue the event
  (pull-based queue like imports) and answer 200 fast.
- Worker: match comment text against the media's active rules (case/diacritic
  folded), dedupe per comment id, send one private reply via the Graph API, record
  the outcome; respect rate limits; never send after 7 days.
- Tables: `instagram_connections`, `dm_rules` (+ keywords), `dm_sends`. Every
  list endpoint uses the standard PageResult envelope.
- Token refresh job; disconnect + data deletion callback.

## Open questions

- DM content: link to `recipely.net/recipes/:id` (works for non-users) vs. a
  rich card — the Private Replies API sends text (+ link preview); decide in design.
- Whether to offer TikTok later (TikTok has no comparable DM API today).
