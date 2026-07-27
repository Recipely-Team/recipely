# Recipely — Android manual QA

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
| Android version | |
| Screen size & density | |
| Build variant | `development` / `production` |
| App version (Settings → About) | |
| Build type | debug / **release** (R8 minified) |
| Network | Wi-Fi / cellular |
| Date | |

> Run the pass at least once on a **release** build. Debug builds skip R8
> minification, so a class stripped by ProGuard only surfaces in release.

---

## A. Setup & first launch

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| A1 | Fresh install, launch | Splash appears, then onboarding — no white screen, no crash | | |
| A2 | Swipe through all onboarding slides | Illustrations animate, dots track position, no clipped text | | |
| A3 | Tap "Explore without signing in" | Lands on the recipe feed as a guest | | |
| A4 | Kill and relaunch | Onboarding does NOT reappear; goes straight to the feed | | |
| A5 | Check "Don't show this page again" then relaunch | Onboarding stays hidden | | |

## B. Account

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| B1 | Register with a new e-mail | Verification-code screen appears | | |
| B2 | Enter the wrong code | Inline error, no navigation | | |
| B3 | Enter the correct code | Account created, signed in, lands on the feed | | |
| B4 | Sign out (Settings → Sign out) | Returns to a signed-out state | | |
| B5 | Sign in with e-mail + password | Signed in | | |
| B6 | Sign in with a wrong password | Clear error message, stays on the screen | | |
| B7 | **Sign in with Google** | Google account picker → signed in | | |
| B8 | Confirm no Apple button is shown | Apple sign-in is iOS-only and must be **absent** here | | |
| B9 | Forgot password → enter e-mail | Success view, reset mail arrives | | |
| B10 | Open the reset link, set a new password | Success view; new password works | | |
| B11 | Open the reset link a second time | "Invalid link" view, not a crash | | |

## C. Discover / home feed

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| C1 | Scroll the feed | Cards load, images render, no blank tiles | | |
| C2 | Scroll to the bottom | Next page loads (infinite scroll) | | |
| C3 | **Pull to refresh** | Spinner sits **just below the header band** — not floating over the AI banner — then the feed refreshes | | |
| C4 | Collapse the header by scrolling down | Title shrinks away smoothly, no jump | | |
| C5 | Search for a recipe | Results filter as expected | | |
| C6 | Search for gibberish | Empty state with a message, not a blank screen | | |
| C7 | Open Filter, pick a cuisine + a max time | Feed filters; active-filter chips appear | | |
| C8 | Remove a filter chip | That filter clears, feed updates | | |
| C9 | Change sort order | Order changes | | |
| C10 | Tap a cuisine in the cuisine strip | Feed filters to that cuisine | | |
| C11 | Tap the AI banner | Opens the AI create flow | | |
| C12 | Turn airplane mode on, pull to refresh | Readable error/offline state, no crash | | |

## D. Recipe detail

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| D1 | Open a recipe | Hero photo, title, meta row all render | | |
| D2 | Swipe the photo gallery | Pages between photos, dot indicator and counter track | | |
| D3 | Tick ingredients | Checkboxes toggle and persist while on the screen | | |
| D4 | Tick a step | Step shows completed styling | | |
| D5 | **Open a recipe with a very long step** | Step text wraps and the card **grows**; no inner scrollbar, no clipped text, the number badge stays a circle | | |
| D6 | Find a step with a time ("10 minutes") | An inline timer chip appears next to it | | |
| D7 | Scroll to nutrition | Values render, no overflow | | |
| D8 | Tap the author card | Opens that user's profile | | |
| D9 | Like the recipe | Heart fills, count increments | | |
| D10 | Save the recipe | Save state changes; it appears under My Recipes → Saved | | |
| D11 | Post a comment | Comment appears at the top of the list | | |
| D12 | **Type a long multi-line comment** | The field **grows** as you type and shrinks when you delete — never scrolls internally | | |
| D13 | Like and then delete your own comment | Both work | | |
| D14 | Load more comments | Older comments append | | |
| D15 | Share the recipe | Share sheet opens with a working link | | |
| D16 | As a guest, try to like/comment | Sign-in prompt sheet appears (not a silent failure) | | |

## E. Timers & alarm

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| E1 | Start an inline step timer | Countdown starts; the docked active-timers bar appears | | |
| E2 | Navigate to another screen | The timers bar stays visible and keeps counting | | |
| E3 | Pause, then resume | Countdown pauses and resumes correctly | | |
| E4 | Start two timers on different steps | Both run independently and both show in the bar | | |
| E5 | Send the app to the background, wait for a timer to finish | A notification fires | | |
| E6 | Tap the notification | Opens the app on the right recipe | | |
| E7 | Let a timer finish with the app open | **Full-screen alarm** takes over, with sound + vibration | | |
| E8 | Dismiss the alarm | Alarm closes, returns to where you were | | |
| E9 | Silence the phone, finish a timer | Vibration still fires (alarm channel) | | |
| E10 | Finish a timer with the screen locked | Notification is visible on the lock screen | | |

## F. Create a recipe

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| F1 | Open Create → type a prompt → Generate | Generating showpiece animates; orbit spins, core breathes | | |
| F2 | Wait for generation | Preview appears with a full recipe | | |
| F3 | Use the refine chat ("make it vegetarian") | Recipe updates accordingly | | |
| F4 | Edit the title, servings and time | Fields accept input | | |
| F5 | **Edit a step and type a very long instruction** | The row **grows**; no inner scrollbar | | |
| F6 | Add and remove ingredients and steps | Rows add/remove correctly, numbering stays right | | |
| F7 | Pick cuisine / category / difficulty | Pickers open and selections stick | | |
| F8 | Add photos from the gallery | Photos attach and preview | | |
| F9 | Take a photo with the camera | Photo attaches | | |
| F10 | Remove a photo | Removed from the strip | | |
| F11 | Leave the flow mid-edit | Exit sheet asks before discarding | | |
| F12 | Reopen Create | "Resume draft" card offers the unfinished recipe | | |
| F13 | Resume the draft | All fields restored | | |
| F14 | Save the recipe | Appears under My Recipes | | |
| F16 | Delete a recipe | Confirmation, then it disappears | | |
| F17 | Try to save with an empty title | Field-level error, no crash | | |

## G. Instagram import (share intent)

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| G1 | Open Instagram, share a cooking Reel → Recipely | App opens on the import flow | | |
| G2 | Wait for the import | Progress copy runs; the bar parks just short of full while the backend finishes | | |
| G3 | Import completes | Preview shows a structured recipe from the video | | |
| G4 | Repeat with the app already running in the background | Import still starts | | |
| G5 | Share a non-cooking video | Readable error, no crash or infinite spinner | | |

## H. My recipes, notifications, profile

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| H1 | My Recipes → Mine tab | Your recipes are listed | | |
| H2 | My Recipes → Saved tab | Saved recipes are listed | | |
| H3 | Drafts section | Unfinished drafts are listed and resumable | | |
| H4 | Have someone comment on / like your recipe | Notification arrives; unread badge increments | | |
| H5 | Open the notification centre | Item is listed and marked unread | | |
| H6 | Tap an item | Deep-links to the right recipe/comment | | |
| H7 | Mark all read | Badge clears | | |
| H8 | Profile → Edit profile → change display name | Saves and shows everywhere | | |
| H9 | Edit profile → change the bio to a long text | Field **grows**; character counter updates; saves | | |
| H10 | Edit profile → change the avatar | Uploads and appears immediately | | |
| H11 | Profile stats (recipes / likes) | Numbers look correct | | |

## I. Settings

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| I1 | Switch each theme palette | Colours change app-wide immediately | | |
| I2 | Mode → Light / Dark / System | Applies immediately; System follows the device | | |
| I3 | Change the device theme while the app is open (System mode) | App follows without a restart | | |
| I4 | Switch language EN ↔ TR | All visible text switches; **no key names like `settings.title` leak through** | | |
| I5 | In Turkish, check buttons and chips | Longer Turkish words are **not clipped** — boxes grow instead | | |
| I6 | Privacy policy / Terms | Open in a browser and load | | |
| I7 | About | Version matches the build | | |
| I8 | **Delete account** → confirm | Account deleted, signed out | | |
| I9 | Try signing in with the deleted account | Rejected — it must not work | | |

## J. Responsive & accessibility — the regression suite

> These target the sizing rework. If something is going to be wrong, it is here.

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| J1 | Settings → Display → **Font size to maximum**, reopen the app | Text grows; **nothing is clipped or overlapping** anywhere | | |
| J2 | At max font size, check buttons, chips and list rows | Boxes **grow taller** instead of cutting text off | | |
| J3 | At max font size, open a recipe's steps | Step text is fully readable; number badge stays circular | | |
| J4 | Settings → Display → **Display size to maximum** | Layout still works, no horizontal overflow | | |
| J5 | Rotate to landscape on the feed | Layout adapts, nothing overlaps | | |
| J6 | Rotate to landscape on a recipe detail | Hero photo resizes in proportion, does not eat the screen | | |
| J7 | Rotate while a bottom sheet is open | Sheet stays usable | | |
| J8 | Test on the **smallest** device you have | Nothing clipped; tap targets still comfortable | | |
| J9 | Test on a **tablet** if available | Controls do not become comically large; layout still sensible | | |
| J10 | Enable TalkBack, walk the feed and a recipe | Buttons announce a meaningful label, not "button" | | |

## K. Android-specific

| # | Step | Expected | R | Note |
|---|---|---|---|---|
| K1 | **Hardware/gesture back** from a recipe | Goes back one screen, does not exit the app | | |
| K2 | Back from the feed (root) | Exits the app (or shows the expected behaviour), no crash | | |
| K3 | Back while a bottom sheet is open | Closes the sheet only | | |
| K4 | **Tap the comment box — does the keyboard cover it?** | The field scrolls above the keyboard and stays visible | | |
| K5 | Same in the recipe editor's step fields | Field stays visible above the keyboard | | |
| K6 | Same in the AI prompt field | Field stays visible above the keyboard | | |
| K7 | Rotate with the keyboard open | No layout break | | |
| K8 | Put the app in split-screen / multi-window | Layout adapts, no crash | | |
| K9 | Revoke the notification permission, then start a timer | Graceful handling, no crash | | |
| K10 | Revoke camera/photos permission, then try to add a photo | Clear message, no crash | | |
| K11 | **Release build only:** run the whole pass again quickly | No `ClassNotFoundException` / blank screens from R8 stripping | | |
| K12 | Deep link: open a shared recipely.net recipe link | Opens in the app on that recipe | | |
| K13 | Force-stop the app with a timer running, reopen | Timer state is restored or cleanly gone — not corrupt | | |
| K14 | Low battery / battery saver on, finish a timer | Notification still fires | | |

---

## Report back

Fill this in and send it to me. Include the environment table from the top.

```
ENV: <device> / Android <version> / <debug|release> / <dev|prod> / v<version>

RESULTS
A: A1 P  A2 P  A3 P  A4 P  A5 P
B: B1 P  B2 P  ...
C: ...
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
