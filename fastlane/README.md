# Store listing metadata

Store-listing copy and assets for **both** stores, kept under version control so
the repo — not a browser tab — is the record of what is published.

```
fastlane/
  metadata/
    android/<locale>/        Google Play  (fastlane supply layout)
      title.txt                 ≤ 30 chars
      short_description.txt     ≤ 80 chars
      full_description.txt      ≤ 4000 chars
      changelogs/default.txt    ≤ 500 chars — fallback release notes
    <locale>/                App Store    (fastlane deliver layout)
      name.txt                  ≤ 30 chars
      subtitle.txt              ≤ 30 chars
      promotional_text.txt      ≤ 170 chars — editable without a new build
      keywords.txt              ≤ 100 chars, comma-separated, no spaces
      description.txt           ≤ 4000 chars
      release_notes.txt         ≤ 4000 chars — per version
  screenshots/<locale>/      App Store screenshots (deliver picks them up here)
```

Locales: Play uses `en-US` / `tr-TR`; the App Store uses `en-US` / **`tr`**.
Keep both languages in sync, like the in-app i18n.

> The two layouts coexist deliberately: `supply` only reads `metadata/android/`
> and `deliver` only reads locale folders at the `metadata/` root, so `android`
> is ignored by `deliver`.

Source copy lives in the **Listing Hub** design project (`hub-data.js`), which
also exports every image. When you change copy there, mirror it into these files
in the same PR — otherwise the repo drifts from what is live, which is exactly
what had happened before this file was rewritten.

---

## Assets and their sizes

The Listing Hub exports everything at the right size. Filenames come out as
`recipely-{platform}-{lang}-{NN}.png`.

| Asset | Size | Where it goes |
|---|---|---|
| App Store screenshots (6) | 1290 × 2796 | `fastlane/screenshots/<locale>/` |
| Play screenshots (6) | 1080 × 1920 | Play Console (not read by `supply` here) |
| App icon — App Store | 1024 × 1024 | App Store Connect |
| App icon — Play | 512 × 512 | Play Console |
| Play feature graphic | 1024 × 500 | Play Console |

`deliver` orders screenshots alphabetically, so the `01…06` suffix already gives
the right sequence. Drop the six PNGs for a language straight into that
language's folder and leave the names alone.

### App Store rules the Hub copy does not know about

Four things cost a failed upload each before they were written down:

- **A screenshot may not draw its own status bar.** Build 1.0.43 (694) was rejected under
  guideline **2.3.10** — *"revise the app's screenshots to remove non-iOS status bar images"*.
  The frames drew `9:41` + `5G` + a battery in the app's webfont, missing the signal and wifi
  glyphs and ordering the rest the way no iOS device does, straight over the app's own buttons.
  The Hub now renders that band as an empty spacer; keep it that way and let a real capture
  carry real chrome. The PNGs in `screenshots/` are the ones that got rejected — they predate
  the Hub (exported before #301) and still carry both the fake bar and the star-rating /
  testimonial cards the Hub has since dropped. **They must be re-exported before the next
  submission, not re-uploaded.**

- **No emoji in `description.txt`.** The App Store rejects the whole field:
  `Description can't contain the following character(s): 🔖, 🤖, …`. Play accepts
  them, which is why `metadata/android/*/full_description.txt` still has the
  emoji section headers and the App Store copy uses plain uppercase ones. Keep
  the two deliberately different.
- **`name.txt` must be globally unique across the App Store.** Adding a
  localization fails with *"You cannot add this localization because the app
  name is already being used by another app"* — the English name
  `Recipely - AI Recipe Chef` is taken, which is why `en-US` is not yet a live
  App Store localization.
- **Screenshots go in the 6.9" slot, not 6.5".** 1290 × 2796 is only valid for
  the slot Apple labels *6.5", 6.7" or 6.9" Displays*; the separate 6.5" entry
  wants 1242 × 2688. Fill 6.9" and the smaller sizes inherit from it.

> `deliver` re-uploads a screenshot when its post-upload check races Apple's
> eventual consistency, and the retry lands as a DUPLICATE rather than
> replacing. Always re-open Media Manager and count after an upload.

> Verify the required screenshot sizes in App Store Connect before a submission
> — Apple changes which display classes are mandatory, and a set that passed
> last release can be rejected at upload.

---

## Uploading

### App Store

Authentication uses the App Store Connect API key CI already holds as
`ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8_BASE64` (base64-encoded .p8). Nothing in this repo stores a
credential — export them in your shell for a manual run.

```bash
# metadata + screenshots only; never touches the build
bundle exec fastlane deliver \
  --app_identifier net.recipely.app \
  --skip_binary_upload true \
  --skip_app_version_update false
```

Run it **without** `--force` the first time and read the generated HTML preview:
it lists exactly which fields and images will be replaced. Add `--force` only
once the preview looks right.

`promotional_text` and `keywords` can be updated on a live version without
submitting a new build. `name`, `subtitle`, `description` and screenshots need a
version in an editable state.

### Google Play

CI (`.github/workflows/ci.yml`) pushes the **AAB** and the per-locale release
notes from `distribution/whatsnew/` on every push to `main`. It does **not**
push the title / short / full description — those are still manual:

- paste the files above into Play Console → Main store listing, or
- `bundle exec fastlane supply --skip_upload_apk --skip_upload_aab`

Keep `distribution/whatsnew/whatsnew-<locale>` and
`metadata/android/<locale>/changelogs/default.txt` saying the same thing.

---

## Before every release

- [ ] Copy in these files matches the Listing Hub
- [ ] Release notes written for **both** stores, in **both** languages
- [ ] Six screenshots per language present in `screenshots/<locale>/`, re-exported from the
      Hub — no drawn status bar, no ratings, no review quotes (see the rules above)
- [ ] Character counts still under the limits (the Hub shows a live counter)
- [ ] iOS: re-run the section Z checks in [`docs/qa/ios.md`](../docs/qa/ios.md) —
      guest browsing and in-app account deletion are what got build 321 rejected
