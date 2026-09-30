# Recipely Kitchen — curated, copyright-free recipes

Recipes Recipely publishes itself, under the official "Recipely Mutfağı" account.
They live in the normal feed (the home page and search) like any recipe, so the
diary's Add food finds them through its existing Recipes tab. There is no separate
diary-only catalogue.

## Why every part is copyright-free

| Part | Source | Why it is clean |
|---|---|---|
| Nutrition | USDA FoodData Central (Foundation + SR Legacy) | Public domain (CC0). Credited as "Source: USDA FoodData Central" |
| Ingredient list | Written by us: grams per ingredient, each mapped to an FDC id | A list of ingredients is not copyrightable, and ours is not copied |
| Steps and description | Written by our own model, then moderated | Original text; nothing is copied from a site or a book |
| Photo | Wikimedia Commons / Openverse, **only** CC0, public domain, CC BY or CC BY-SA | Each photo keeps its author, licence and source URL, shown as a credit line |

NC (non-commercial) and ND (no-derivatives) licences, unknown licences, stock
sites and AI-generated photos are **never** used.

## Quality gates (a recipe that fails one is not published)

**Nutrition**
- Every ingredient has an FDC id and a gram weight.
- Per-serving values are computed from the FDC values; nothing is estimated.
- The energy check: kcal ≈ 4·protein + 4·(carbs − fiber) + 9·fat + 2·fiber, within 12%
  (FDC carbohydrate is by difference and already includes fiber).
- A per-serving kcal outside the dish category's plausible band goes to review:
  soup 60–350, main 200–900, side 80–500, dessert 150–700, breakfast 100–700, drink 0–350.

**Photo**
- ≥ 1200 px on the short side. No watermark, no overlaid text, no collage.
- The photo shows the finished dish, recognisably this dish, plated. It does not show
  raw ingredients or a similar-but-different dish.
- Every photo is looked at by eye (by Claude, image by image) before import. Rejects
  are logged with a reason.

**Text**
- The steps must use exactly the listed ingredients, and each listed ingredient must
  appear in a step.
- Times are consistent: the total is the sum of prep and cook.
- The text passes the existing content moderator.

## Data shape (backend)

- `RecipeOrigin` gains `CURATED`.
- `recipes` gains `image_credit_author`, `image_credit_license` (`CC0` | `PD` | `CC-BY-x.y` |
  `CC-BY-SA-x.y`), `image_credit_url` (the source page) and `nutrition_source` (`USDA_FDC`).
  All are nullable and set only on curated recipes.
- The official account is one user row with `role = 'official'`. Its recipes are
  `origin = CURATED`, `isPublished = true` and moderation approved.
- Import is an idempotent script (`npm run curated:import <file>`). Its key is
  `(ownerId, slug)`, so a re-run updates the recipe in place.
- Dataset: `data/curated-recipes/*.json` in the backend repo, one file per recipe:
  slug, name (tr + en), category, cuisine, servings, times, ingredients `[{ fdcId, grams, label }]`,
  steps, the computed nutrition, the image file and its credit.

## App

- The provenance seal gains a "Recipely Mutfağı" variant for `CURATED`.
- Recipe detail shows a small credit line under the photo, e.g. "Photo: Jane Doe · CC BY-SA 4.0",
  linking to the source. For curated recipes it also shows "Nutrition: USDA FoodData Central".
- Both are new visual pieces, so they are designed in Claude Design first (rule 28).

## Order

1. Backend: the origin value, the credit columns, the official account and the import
   script, with tests. (No network needed.)
2. Design: the seal variant and the credit line.
3. Pipeline (needs network access): the FDC subset, ~300 Turkish dishes plus everyday
   basics, the photos picked and checked by eye, and every quality gate run. Output is
   the JSON dataset.
4. Import on dev, check it in the app (screenshots), then release.
