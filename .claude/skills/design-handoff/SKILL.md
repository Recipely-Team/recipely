---
name: design-handoff
description: The Recipely design flow (CLAUDE.md rule 28) — draw the thing in the Claude Design prototype first, get an RN implementation spec out of the prototype, write design-spec.md, build, then compare the built screen against the prototype. Use for any work with a visual surface — a new screen, widget, badge, state or redesign — before writing UI code, and when checking a built UI against the design.
---

# Design handoff (rule 28)

The prototype is the visual source of truth, not a document about it.

**Prototype:** [Recipely Prototype](https://claude.ai/design/p/174d3c66-20f8-49e9-bffa-3bf97ef8aaf1?file=Recipely+Prototype.html)

It carries the real screens (Onboarding, Login, Register, Reset, Recipes, Detail, My Recipes,
Create (AI + Manual), Profile, Notifs, Settings, IG paste link, IG importing, Alarm, Search). Its
TWEAKS panel switches platform (Auto / Mobil / Web), mode (System / Light / Dark), language
(English / Türkçe) and the four theme palettes — review every combination the design will ship in.

If the link is dead or you have no access, STOP and ask for it. Never substitute something else
and call it the design.

## 1. Draw it in the prototype

The thing itself, on the screen it belongs to — in Claude Design, **not** in an Artifact, not as
a description, not as a token table. Do not invent measurements (*"designdan tasarımı al, kafana
göre saçma tasarım yapma."*).

## 2. Get the developer spec out of the prototype

- In the prototype's chat, ask it to **write an "RN implementation spec" `.md` file into the
  project** (tokens, measurements, states, per-platform differences). Asking it to "paste verbatim
  source" gets refused — ask for the spec file.
- Open that file in Claude Design, click its **Copy** button, then read it locally with `pbpaste`.
- The preview canvas cannot be clicked or scripted; do not try to drive it with browser automation.

## 3. Write it down

Record the tokens, contrast measurements and reasoning in `src/presentation/design-spec.md`
(`ui-designer` owns this; involve it only for a genuinely new visual surface). The spec explains
the prototype; it does not replace it. Colours go through `themes.ts`
(`src/presentation/base/theme/colors/palette/`), measurements through the token modules in
`src/presentation/base/theme/tokens/` (rule 5, `architecture.md` §5a). Validate every text/background
pair with `contrastRatio()` from `src/presentation/base/theme/colors/contrast/contrast.ts` (WCAG AA:
4.5:1 body, 3:1 large text and UI).

## 4. Build, then compare

Build from the spec (`rn-developer`). Then open the same screen in the prototype beside the built
one and compare, at phone, tablet and desktop widths and in light and dark. "Tests pass" is not the
same claim as "it looks like the design." Take screenshots of the built UI and inspect them before
reporting.

**A written spec is not a design.** The provenance badge was specced into `design-spec.md` and
implemented without the prototype ever being opened — nobody could tell by looking at the repo
whether it was the designed badge.
