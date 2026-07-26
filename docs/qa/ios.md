# Recipely — iOS manual QA

Step-by-step regression pass. Work top to bottom; each section is independent
apart from **A. Setup** and **B. Account**, which the rest depend on.

## How to use this

Mark every row with one of:

| Code | Meaning |
|---|---|
| `P` | Pass — behaved exactly as the Expected column says |
| `F` | Fail — did not |
| `B` | Blocked — could not test (say why) |
| `S` | Skipped |

**Only `F` and `B` rows need a note.** When you are done, send me the filled
report block at the bottom — that is all I need to work from.

### Fill this in first

| Field | Value |
|---|---|
| Device / model | |
| iOS version | |
| Notch / Dynamic Island / home button | |
| Build variant | `development` / `production` |
| App version (Settings → About) | |
| Install source | Simulator / device / **TestFlight** |
| Network | Wi-Fi / cellular |
| Date | |

> Run at least one pass on a **physical device via TestFlight**. Sign in with
> Apple, push notifications, the share extension and the alarm's audio session
> do not behave the same in the Simulator.

---

## ⚠️ Section Z first: App Store review blockers

Build 321 was **rejected under guideline 5.1.1(v)** for two things. Both are
fixed, and both must be re-verified on every release candidate. Do this section
first — if either fails, the build cannot be submitted.

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| Z1 | Fresh install → onboarding → **"Explore without signing in"** | You reach the full recipe feed **without an account** | | |
| Z2 | As a guest, open a recipe and read it end to end | Photos, ingredients, steps, nutrition all readable — **no login wall** | | |
| Z3 | As a guest, search and filter | Works without an account | | |
| Z4 | As a guest, tap Like / Comment / Save | A sign-in prompt appears — this is allowed; the *browsing* must not be gated | | |
| Z5 | Signed in: Settings → **Delete account** | The option is present and reachable **inside the app** | | |
| Z6 | Confirm deletion | Account is deleted and you are signed out | | |
| Z7 | Try to sign in again with those credentials | Rejected | | |
| Z8 | Record a **screen recording** of Z1→Z2 and Z5→Z6 | Saved, ready to attach to the review reply | | |

## A. Setup & first launch

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| A1 | Fresh install, launch | Splash then onboarding — no white screen, no crash | | |
| A2 | Swipe through all onboarding slides | Illustrations animate, dots track, no clipped text | | |
| A3 | Tap "Explore without signing in" | Lands on the feed as a guest | | |
| A4 | Kill and relaunch | Onboarding does not reappear | | |
| A5 | Check the safe area on the feed and a recipe | Nothing sits under the notch / Dynamic Island or the home indicator | | |

## B. Account

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| B1 | Register with a new e-mail | Verification-code screen appears | | |
| B2 | Enter the wrong code | Inline error, no navigation | | |
| B3 | Enter the correct code | Signed in, lands on the feed | | |
| B4 | Sign out | Returns to a signed-out state | | |
| B5 | Sign in with e-mail + password | Signed in | | |
| B6 | Wrong password | Clear error, stays on the screen | | |
| B7 | **Sign in with Apple** | Native Apple sheet → signed in | | |
| B8 | Sign in with Apple choosing **"Hide My Email"** | Still signs in; the relay address is handled without error | | |
| B9 | Sign in with Apple a second time | Signs in to the **same** account, does not create a duplicate | | |
| B10 | **Sign in with Google** | Google flow → signed in | | |
| B11 | Forgot password → enter e-mail | Success view, reset mail arrives | | |
| B12 | Open the reset link, set a new password | Success view; new password works | | |
| B13 | Open the reset link a second time | "Invalid link" view, not a crash | | |

## C. Discover / home feed

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| C1 | Scroll the feed | Cards load, images render, no blank tiles | | |
| C2 | Scroll to the bottom | Next page loads | | |
| C3 | **Pull to refresh** | Spinner appears in the right place under the header, feed refreshes | | |
| C4 | Collapse the header by scrolling | Title shrinks smoothly, no jump | | |
| C5 | Search for a recipe | Results filter | | |
| C6 | Search for gibberish | Empty state, not a blank screen | | |
| C7 | Filter by cuisine + max time | Feed filters; active chips appear | | |
| C8 | Remove a filter chip | Filter clears | | |
| C9 | Change sort order | Order changes | | |
| C10 | Tap a cuisine in the strip | Feed filters | | |
| C11 | Tap the AI banner | Opens the AI create flow | | |
| C12 | Airplane mode → pull to refresh | Readable offline state, no crash | | |

## D. Recipe detail

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| D1 | Open a recipe | Hero, title, meta row render | | |
| D2 | Swipe the photo gallery | Pages correctly; dots and counter track | | |
| D3 | Tick ingredients | Checkboxes toggle | | |
| D4 | Tick a step | Completed styling applies | | |
| D5 | **Open a recipe with a very long step** | Step wraps and the card **grows** — no inner scrollbar, no clipping, badge stays circular | | |
| D6 | Find a step with a time ("10 minutes") | Inline timer chip appears | | |
| D7 | Scroll to nutrition | Renders without overflow | | |
| D8 | Tap the author card | Opens their profile | | |
| D9 | Like the recipe | Heart fills, count increments | | |
| D10 | Save the recipe | Appears under My Recipes → Saved | | |
| D11 | Post a comment | Appears at the top | | |
| D12 | **Type a long multi-line comment** | Field **grows** while typing and shrinks on delete | | |
| D13 | Like and delete your own comment | Both work | | |
| D14 | Load more comments | Older comments append | | |
| D15 | Share the recipe | iOS share sheet with a working link | | |
| D16 | **Swipe from the left edge to go back** | Returns to the previous screen smoothly | | |

## E. Timers & alarm

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| E1 | Start an inline step timer | Countdown starts; docked timers bar appears | | |
| E2 | Navigate elsewhere | Bar stays and keeps counting | | |
| E3 | Pause, then resume | Works | | |
| E4 | Start two timers | Both run independently | | |
| E5 | Background the app, wait for a timer | Notification fires | | |
| E6 | Tap the notification | Opens on the right recipe | | |
| E7 | Timer finishes with the app open | **Full-screen alarm** with sound + haptics | | |
| E8 | Dismiss the alarm | Closes, returns where you were | | |
| E9 | **Silent switch ON**, finish a timer | Behaviour is deliberate — note exactly what happens (sound? haptics only?) | | |
| E10 | Finish a timer with the screen locked | Notification visible on the lock screen | | |
| E11 | First timer ever → push permission prompt | Prompt appears once; denying it does not crash the app | | |
| E12 | Deny notifications, then start a timer | In-app countdown still works; no crash | | |

## F. Create a recipe

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| F1 | Create → type a prompt → Generate | Generating animation runs | | |
| F2 | Wait for generation | Preview shows a full recipe | | |
| F3 | Refine chat ("make it vegetarian") | Recipe updates | | |
| F4 | Edit title, servings, time | Fields accept input | | |
| F5 | **Edit a step with a very long instruction** | Row **grows**; no inner scrollbar | | |
| F6 | Add/remove ingredients and steps | Numbering stays correct | | |
| F7 | Pick cuisine / category / difficulty | Selections stick | | |
| F8 | Add photos from the library | Attach and preview | | |
| F9 | Take a photo with the camera | Attaches | | |
| F10 | Remove a photo | Removed | | |
| F11 | Leave mid-edit | Exit sheet asks first | | |
| F12 | Reopen Create | "Resume draft" card appears | | |
| F13 | Resume the draft | Fields restored | | |
| F14 | Save | Appears under My Recipes | | |
| F15 | Edit and re-save | Changes persist | | |
| F16 | Delete a recipe | Confirmation then removal | | |
| F17 | Save with an empty title | Field error, no crash | | |

## G. Instagram import (share extension)

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| G1 | Instagram → share a cooking Reel → Recipely | App opens on the import flow | | |
| G2 | Wait for the import | Progress runs; the bar parks just short of full while the backend finishes | | |
| G3 | Import completes | Preview shows a structured recipe | | |
| G4 | Repeat with Recipely already backgrounded | Import still starts | | |
| G5 | Share a non-cooking video | Readable error, no crash or endless spinner | | |

## H. My recipes, notifications, profile

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| H1 | My Recipes → Mine | Your recipes listed | | |
| H2 | My Recipes → Saved | Saved recipes listed | | |
| H3 | Drafts | Listed and resumable | | |
| H4 | Have someone comment on / like your recipe | Push arrives; badge increments | | |
| H5 | Notification centre | Item listed as unread | | |
| H6 | Tap an item | Deep-links correctly | | |
| H7 | Mark all read | Badge clears | | |
| H8 | Edit profile → display name | Saves and shows everywhere | | |
| H9 | Edit profile → long bio | Field **grows**; counter updates; saves | | |
| H10 | Edit profile → change avatar | Uploads and appears immediately | | |
| H11 | Profile stats | Numbers look correct | | |

## I. Settings

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| I1 | Switch each theme palette | Colours change app-wide immediately | | |
| I2 | Mode → Light / Dark / System | Applies immediately | | |
| I3 | Change iOS appearance while the app is open (System mode) | App follows without a restart | | |
| I4 | Language EN ↔ TR | All text switches; **no raw keys leak through** | | |
| I5 | In Turkish, check buttons and chips | Longer Turkish words are **not clipped** | | |
| I6 | Privacy policy / Terms | Open and load | | |
| I7 | About | Version matches the build | | |
| I8 | Delete account | (covered in Z5–Z7) | | |

## J. Responsive & accessibility — the regression suite

> These target the sizing rework. If something is going to be wrong, it is here.

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| J1 | Settings → Accessibility → Display & Text Size → **Larger Text to maximum** | Text grows; **nothing clipped or overlapping** anywhere | | |
| J2 | At max text size, check buttons, chips and list rows | Boxes **grow taller** instead of cutting text off | | |
| J3 | At max text size, open a recipe's steps | Fully readable; number badge stays circular | | |
| J4 | Turn on **Bold Text** | Layout survives | | |
| J5 | Rotate to landscape on the feed | Layout adapts | | |
| J6 | Rotate to landscape on a recipe detail | Hero photo resizes in proportion | | |
| J7 | Rotate while a bottom sheet is open | Sheet stays usable | | |
| J8 | Test on the **smallest** device you have (SE-class) | Nothing clipped; tap targets comfortable | | |
| J9 | Test on an **iPad** if available | Controls do not become oversized; layout sensible | | |
| J10 | Enable VoiceOver, walk the feed and a recipe | Buttons announce meaningful labels | | |
| J11 | Enable **Reduce Motion**, open the AI generating view | No jarring animation; app stays usable | | |

## K. iOS-specific

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| K1 | Swipe-back from every pushed screen | Works everywhere, never traps you | | |
| K2 | **Keyboard over the comment box** | Field scrolls above the keyboard | | |
| K3 | Same in the recipe editor's step fields | Field stays visible | | |
| K4 | Same in the AI prompt field | Field stays visible | | |
| K5 | Rotate with the keyboard open | No layout break | | |
| K6 | Universal link: open a recipely.net recipe link from Messages/Notes | Opens **in the app**, on that recipe | | |
| K7 | Same link while the app is already open | Navigates to that recipe | | |
| K8 | Deny photo-library permission, try to add a photo | Clear message, no crash | | |
| K9 | Deny camera permission, try the camera | Clear message, no crash | | |
| K10 | App Switcher → swipe the app away with a timer running, reopen | Timer state restored or cleanly gone — not corrupt | | |
| K11 | Low Power Mode on, finish a timer | Notification still fires | | |
| K12 | Dynamic Island / notch devices: full-screen alarm | Alarm respects the safe area | | |
| K13 | Background the app for 10+ minutes, return | Session intact, no forced sign-out, no crash | | |

---

## Report back

Fill this in and send it to me. Include the environment table from the top.

```
ENV: <device> / iOS <version> / <simulator|device|TestFlight> / <dev|prod> / v<version>

RESULTS
Z: Z1 P  Z2 P  Z3 P  Z4 P  Z5 P  Z6 P  Z7 P  Z8 P
A: A1 P  A2 P  ...
B: ...
(one line per section — just the code for each row)

FAILURES
F  D5  Long step still shows a scrollbar on the right edge.
       Recipe: "…", step 3. Screenshot: <link/paste>
B  G1  Could not test — no Instagram account on this device.

NOTES
<anything odd that did not fit a row>
```

For every `F`, the three things that make it fixable fast: **which screen**,
**what you saw vs. expected**, and a **screenshot or screen recording**. If it
only happens sometimes, say roughly how often and what you did just before.

> Section Z failing blocks submission, not just the release. Flag those first.
