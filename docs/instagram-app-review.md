# Instagram App Review — submission pack

For the Meta app **Recipely** (use case "Manage messaging & content on Instagram",
API setup with Instagram login). Board: [comment-to-dm-plan.md](comment-to-dm-plan.md).
Why it is needed: in Development mode `GET /{media}/comments` returns an empty list even
for accepted testers, and comment webhooks never arrive (verified 2026-10-03), so the
feature only works with **Advanced Access**.

## Before submitting (App settings → Basic)

- [ ] App icon (1024×1024), category **Food & Drink**, contact email.
- [ ] Privacy Policy URL: `https://recipely.net/privacy`
- [ ] Terms of Service URL: `https://recipely.net/terms`
- [ ] User data deletion: callback `https://api.recipely.net/webhooks/instagram/data-deletion`
- [ ] Deauthorize callback: `https://api.recipely.net/webhooks/instagram/deauthorize`
- [ ] Business login redirect (prod): `https://api.recipely.net/auth/instagram/callback`
- [ ] Webhooks (prod): `https://api.recipely.net/webhooks/instagram`, field **comments** subscribed.
- [ ] **Business Verification** of the "Recipely APP" portfolio completed.
- [ ] The feature is on **production** (app + backend promoted to `main`) — reviewers use
      the store build or recipely.net, not a dev build.

## Permissions to request (Advanced Access)

### instagram_business_basic

> Recipely lets food creators connect their own Instagram professional account so the
> app can show their username on their verified creator profile and list their own
> posts and Reels. The creator picks one of those posts when setting up an automation
> that replies to comments with a recipe. We read only the connected account's profile
> (id, username) and its media (thumbnail, caption, permalink, timestamp). We do not
> read other accounts' data and we never post content.

### instagram_business_manage_comments

> Creators share a recipe in a Reel and receive many comments asking for it ("recipe?",
> "tarif"). In Recipely the creator chooses one of their posts, a keyword and one of
> their own Recipely recipes. Recipely reads new comments on that post only, checks
> whether a comment contains the creator's keyword, and — if the creator turned it on —
> posts one short public reply under that comment (for example "Sent it to your DMs").
> We only process comments on posts the creator selected, only from after the
> automation was enabled, and we store the comment id and text only to avoid replying
> twice and to show the creator an activity log. Data is deleted when the creator
> disconnects or deletes their account.

### instagram_business_manage_messages

> When a comment on the creator's selected post contains their keyword, Recipely sends
> the commenter exactly one private reply (Instagram Private Replies, within 7 days of
> the comment) containing the recipe link the creator chose, e.g. "Hi @name! Here is
> the recipe: https://recipely.net/recipes/…". It is a direct answer to the person's
> own request in a comment — no bulk, promotional or unsolicited messages, one message
> per comment, and nothing outside Instagram's messaging window. The creator writes
> the message text, can pause or delete the automation at any time, and sees every
> send and failure in the app.

## Screencast script (one recording covers all three; 2–3 min, English UI)

Record on a phone (or recipely.net) with the **production** app, narrating or with on-screen captions.

1. Open Recipely, sign in, go to **Profile → Edit profile → Creator account**.
2. Tap **Connect with Instagram** → Instagram's login/consent screen showing the three
   permissions → **Allow** → back in Recipely: "Verified via Instagram", creator badge. *(basic)*
3. Open **Automations → New automation**.
4. Step 1: the grid of the connected account's own posts → pick a Reel. *(basic)*
5. Step 2: add keyword `recipe`. Step 3: pick one of the creator's recipes.
6. Step 4: show the private-reply text with `{name}` and `{link}` and the live preview;
   turn on the optional public reply. **Save.** *(messages, comments)*
7. On a second (tester) Instagram account, comment `recipe` on that Reel. *(comments)*
8. Show the commenter's Instagram inbox receiving the DM with the recipe link, and the
   public reply under the comment. *(messages, comments)*
9. Back in Recipely: **Activity** shows the send with status Sent; toggle the
   automation off and delete it. Then **Disconnect** Instagram.

Note for steps 7–8: in Development mode the API returns no comments, so the end-to-end
part can only be recorded once access is granted for testing — if a reviewer asks,
submit with steps 1–6 + 9 and describe 7–8 in the notes; Meta usually grants
"Standard Access testing" feedback in the review thread.

## Reviewer notes (paste into "Notes for reviewer")

> Test account: [Recipely login email/password for a demo account — fill in, never commit].
> Instagram test account: the reviewer can connect any Instagram professional account,
> or use our test account [handle] (added as Instagram Tester).
> Path: Profile → Edit profile → Creator account → Connect with Instagram → Automations.
> Recipely only acts on comments on posts the creator explicitly selects, sends one
> private reply per matching comment within 7 days, and offers pause/delete/disconnect.
