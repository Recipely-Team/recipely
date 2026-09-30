# Diary voice assistant — action contract

The words the voice assistant uses to drive the Food Diary. The backend offers
them to the model (`recipely-backend` → `src/domain/assistant/assistant-action.ts`,
instruction in `src/infrastructure/assistant/assistant-persona.ts`); the app
handles them (`src/domain/assistant/actions/assistant-action-type.ts` and the
diary screens' action hooks). The two lists must stay identical.

Every `arg` is a string (the model can send nothing else). Structured args are a
JSON object string; handlers parse and validate them and answer a failure
sentence the model can recover from.

## Screens

`navigate` learns two screen names: `diary` (the Diary tab, day view) and
`diaryCalendar` (the month calendar; on the web shell it lands on `diary`,
whose right rail shows the calendar).

## Actions

| Action | Arg | Registered on | Does |
|---|---|---|---|
| `selectDate` | `YYYY-MM-DD`, or `today` / `yesterday` | diary, diaryCalendar | Selects that day the way a tap on the date strip / calendar does (the UI changes to it). On the calendar page it also shows that month. A future date is refused ("that day hasn't happened yet"). |
| `logFood` | JSON `{ "name": string, "meal"?: "breakfast"\|"lunch"\|"dinner"\|"snacks", "servings"?: number, "date"?: "YYYY-MM-DD", "calories"?: number, "protein"?: number, "carbs"?: number, "fat"?: number, "fiber"?: number }` — nutrition is **per serving** | diary; recipe detail (arg may be omitted or name-less there: the open recipe) | Resolves `name` against the user's own recipes, saved recipes, the loaded feed and recent foods (locale-aware, case-insensitive; best match). A match uses that food's nutrition. No match + `calories` given → a quick-add food with those numbers. No match and no `calories` → failure "no such food; estimate its nutrition per serving and call again with calories". `meal` defaults to the clock rule, `servings` to 1 (0.5 steps, 0.5..20), `date` to the selected day. Result sentence names what was logged, where, and the kcal. |
| `searchFood` | query string | diary | Opens the Add food sheet with the query in its search field (the user sees the results) and answers the top matches as text: name, kcal per serving, source (my recipe / saved / Recipely / recent). |
| `removeFood` | JSON `{ "name": string, "meal"?: ... }` or a plain name | diary | Removes the matching entry of the selected day. Several matches → failure listing them so the model asks which. |
| `changeFood` | JSON `{ "name": string, "meal"?: ..., "servings"?: number, "toMeal"?: ... }` | diary | Changes servings and/or moves the matching entry to another meal. |
| `addWater` | integer glasses (negative removes), e.g. `"1"`, `"-1"` | diary | Adds to the selected day's water, clamped to 0..12. The instruction tells the model to ASK how much when the user did not say ("I drank water" → "how many glasses?"), and to add exactly what was said otherwise. Result says the new total vs the goal. |
| `setGoals` | JSON partial `{ "calories"?, "protein"?, "carbs"?, "fat"?, "fiber"?, "water"? }` | diary | Merges with the current goals, validates through `NutritionGoals`, saves. Result states the saved goals. |
| `openGoals` | none | diary | Opens the Daily goals sheet. |
| `openAddFood` | optional meal | diary | Opens the Add food sheet (on that meal). |

`readScreen` on `diary` answers: today's date and the selected date (ISO and
spoken), eaten/goal/remaining kcal, the calorie status, each macro eaten/goal,
water glasses/goal, every meal with its entries (name, servings, kcal) and meal
totals, and the goals. On `diaryCalendar`: the shown month, each logged day's
kcal and status, and the month stats (average, days on target, streak). This is
what lets the assistant comment on the user's data.

## Instruction (backend persona) — what the model must know

- The Diary is where the user logs what they ate. Today's date comes from
  readScreen; resolve "1 September", "yesterday", "last Monday" to
  `YYYY-MM-DD` (a date without a year is the most recent past one), then
  `selectDate`. To act on the diary from another screen, `navigate` to `diary` first.
- Logging: for a dish or recipe name call `logFood` with the name; for a
  generic food (bread, an apple, a latte) **estimate per-serving nutrition
  yourself** and pass it. Several foods = several calls. "Plan my whole day" =
  propose breakfast/lunch/dinner/snacks within the goal, say it, and log it
  when the user agrees.
- Water: amount not stated → ask; stated → add exactly that.
- Goals: the user may describe themselves (height, weight, age, sex, activity,
  aim). Compute energy with Mifflin-St Jeor × activity factor, adjust for the
  aim (±~500 kcal), protein ~1.6–2 g/kg, fat ~25–30% of kcal, carbs the rest,
  fiber ~14 g per 1000 kcal; say the numbers in one sentence, then `setGoals`.
  Nothing is required: use what the user gave, ask at most once for what
  matters most (weight), otherwise keep defaults.
- A weekly program is **spoken advice**: propose seven days of meals within
  the goals and the user's likes; log only days up to today, and only when asked.
- Comment on the data when asked (or briefly after reading it): over/under
  goal, macro balance, water, streak — one or two sentences, practical, never
  medical claims.
