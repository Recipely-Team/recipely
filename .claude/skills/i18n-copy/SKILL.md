---
name: i18n-copy
description: Adding, changing or removing user-visible copy in the Recipely app — keys in all 14 locale catalogues with real translations, placeholders and array arity preserved, and the parity tests green. Use whenever a UI string, error message key, button label or any t() key is added or edited, or when a catalogue is found out of sync.
---

# i18n copy

Rule 11: every user-visible string goes through `t()` from `src/presentation/i18n/`. No literal copy
in components.

## Where the copy lives

`src/presentation/i18n/locales/` holds 14 catalogues, one exported object each:
`ar de en es fr hi id it ja ko pt ru tr zh` (`.ts`). `en.ts` is the shape: `Translations` is
`DeepStringify<typeof en>` (`src/presentation/i18n/translations.ts`), so a catalogue missing a key does
not compile.

## Steps

1. Add or change the key in `en.ts` first, in the section of the screen that uses it.
2. Add the same key, in the same position, to **all 13 other catalogues** with a real translation
   written for that language — never English pasted in, never an empty string, never a machine
   placeholder. Turkish copy in `tr.ts` must read naturally (the owner is a Turkish speaker).
3. Keep every placeholder byte-identical: `{n}`, `{name}`, `{count}`, `{cuisine}`, `{value}` are
   substituted at runtime; a translated `{cantidad}` ships literally.
4. Keep array arity identical (e.g. `ideaChips` renders a fixed row).
5. A backend error `messageKey` the app renders needs its key in every catalogue too.
6. Run the parity tests:

   ```bash
   npx tsc --noEmit
   npx jest src/presentation/i18n
   ```

   - `catalogue-parity.test.ts` — all 14 catalogues: same placeholders, same array lengths, no empty
     strings; reports (does not fail) copy identical to English, so read that count.
   - `locale-sync.test.ts` — `en` ↔ `tr` leaf-path parity.

## Notes

- Locale files are data, the only place Turkish (or any non-English prose) belongs in the repo
  (rule 26); store metadata under `fastlane/metadata/tr/` is the other.
- The locale dictionaries are exempt from the 300-line `.tsx` limit (rule 18).
- Release notes are not i18n keys — see the `release` skill.
