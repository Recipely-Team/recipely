# Store Listing Hub

One page that produces everything both stores ask for: the screenshot set, the app icon, the Play
feature graphic, and console-ready metadata copy in EN and TR.

Open it directly — it is a static page with no build step:

```bash
open fastlane/store-hub/index.html
```

Nothing here ships with the app. It lives beside [`fastlane/README.md`](../README.md), which is the
prose record of what the store listings say; this is the thing that generates the assets they need.
It is deliberately **not** in `public/`, so it never reaches recipely.net.

## What it produces

| Section | Output | Sizes |
|---|---|---|
| **1 · Screenshot set** | 6 frames, one continuous panorama background across the whole carousel | App Store 1290×2796 · Play 1080×1920 |
| **2 · Store graphics** | App icon flattened on white; Play feature banner | 1024² / 512² · 1024×500 |
| **3 · Metadata** | Play Console + App Store Connect fields, with live character counters | per-store limits enforced |

Two toggles drive everything: **language** (EN / TR) and **platform** (App Store / Google Play).
The platform toggle re-scales every frame to that store's exact pixels and swaps the device cutout
(Dynamic Island ↔ punch-hole), and hides the fields the other store does not have.

Exports are flattened PNGs with no alpha — both consoles reject transparency.

## Required assets

`assets/images/icon.png` is copied from the app and is already here. **The rest are captures that
live in the [Claude Design project](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1),
not in this repo** — drop them in before the page will render completely:

```
assets/images/panorama-lines.svg    the line art the panorama background is built from
assets/screens/screen-recipes.png   frame 2
assets/screens/screen-create.png    frame 3, and the feature graphic
assets/screens/screen-recipe.png    frame 4
assets/screens/screen-profile.png   frame 6
assets/screens/photo-biryani.png    frame 5 card
assets/screens/photo-risotto.png    frame 5 card
```

Frames 1 and 5 are drawn in markup rather than composited from a capture, so they work without any
of these.

## Before submitting

- **Frame 1 is a design mock, not a capture.** The Instagram-import screen has no shipped capture
  yet, so it is drawn in the app's own Pearl White tokens. Replace it with a real capture.
- **Never ship `screen-myrecipes.png` as a screenshot.** The file is edited — a photo was
  composited into the first card. Frame 5 only crops untouched regions.
- **No social proof anywhere.** No star ratings, review quotes, award badges or download counts.
  Apple (2.3.7 / 2.3.10) and Google Play both reject store graphics showing unverifiable claims or
  UI that does not exist in the app.
- **Never draw a status bar.** The band above each capture is an empty spacer; the only device
  chrome is the island (or the punch-hole on Play). Apple rejected 1.0.43 (694) under **2.3.10 —
  "remove non-iOS status bar images"** because the band drew `9:41` + `5G` + a battery in the app's
  own webfont, with no signal or wifi glyph and in an order iOS never uses, painted over the back
  and bookmark buttons. Drawn chrome cannot be right; a real capture already carries the real one.

## Files

| File | What it holds |
|---|---|
| `index.html` | Page shell, the three sections, the icon and feature-graphic markup |
| `carousel.css` | Frame geometry, device chrome, and the two markup-drawn screens |
| `carousel-frames.js` | The six frames — headline, subhead and media per frame, EN + TR |
| `hub-data.js` | Store metadata copy, both languages |
| `hub-app.js` | Platform/language toggles, responsive fitting, PNG export |

Export uses [`html-to-image`](https://github.com/bubkoo/html-to-image) from a CDN, so the page needs
a network connection the first time. It inlines the Google webfonts as data URIs before rendering —
without that step the exports fall back to a serif face, because the cross-origin stylesheet is
unreadable from the canvas.
