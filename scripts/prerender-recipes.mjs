#!/usr/bin/env node
/**
 * Gives every recipe URL a page of its own instead of the site's front door.
 *
 * The export is one client-rendered shell. `curl https://recipely.net/recipes`
 * returns 55 KB of HTML whose `#root` holds the shimmer skeleton and **not one
 * word of text**, and every `/recipes/<id>` answers with that same shell —
 * same `<title>`, same description, same canonical, no way to tell one recipe
 * from another without executing the bundle. A crawler that does not run the
 * JS therefore sees forty-two identical contentless pages, which is the
 * wording of the AdSense notice this site has now been served twice, and the
 * likeliest reason its one display unit answers `unfilled` on every load: an
 * ad network cannot target a page it was never able to classify.
 *
 * So each approved recipe gets its own HTML file, built from the export's own
 * dynamic-route shell and differing from it only in the head and in a
 * `<noscript>` fallback:
 *
 * - the title `PageTitle` would produce at runtime, the same suffix and all
 * - a description, canonical, Open Graph and Twitter tags naming THIS recipe
 * - a `Recipe` JSON-LD block — the documented, machine-readable form of the
 *   ingredients and steps the page goes on to render
 * - the same content as semantic HTML inside `<noscript>`, for a reader or a
 *   crawler that never runs the bundle
 *
 * Nothing here is content the app does not itself display: the file is a
 * static statement of what the route renders, not a second version of it.
 *
 * Firebase serves `recipes/<id>/index.html` for `/recipes/<id>` before it
 * consults the `/recipes/*` rewrite, so a recipe published since the last
 * deploy still falls through to the shell and renders normally — this makes
 * pages better, never fewer.
 *
 * Runs from `npm run build:web`, after the export, the prune and the robots
 * step. Deliberately NOT part of `build:web:dev`: the dev origin is
 * `noindex`, sits behind Cloudflare Access, and talks to a different backend.
 *
 * Usage: node scripts/prerender-recipes.mjs [dist]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/** Matches `PROD_WEB_APP_BASE_URL` — the canonical public origin. */
const SITE_URL = 'https://recipely.net';
/** Matches `API_BASE_URL` for the production variant. */
const DEFAULT_API_BASE_URL = 'https://api.recipely.net/api/v1';
/** Matches `SiteMetadata.titleSuffix`. */
const TITLE_SUFFIX = ' · Recipely';
/** Matches `DEFAULT_AES_KEY_HEX` in `build-secrets.ts`: the "no key" key. */
const UNSET_AES_KEY = '0'.repeat(64);

const AUTH_TAG_BYTES = 16;
const IV_BYTES = 12;
const REQUEST_TIMEOUT_MS = 20_000;
const ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;
/** Far past any catalogue this site will have, and short of an infinite loop. */
const MAX_PAGES = 200;
/** A recipe below this is a stub, not something a reader came for. */
const MIN_INGREDIENTS = 3;
const MIN_INSTRUCTIONS = 3;
/** Google truncates a description around here; the sentence is built to fit. */
const MAX_DESCRIPTION_CHARS = 160;

const dist = process.argv[2] ?? 'dist';

/** Ends the run without failing the build, for the cases that are not errors. */
const skip = (reason) => {
  console.log(`prerender-recipes: skipped — ${reason}`);
  process.exit(0);
};

// ---------------------------------------------------------------- transport

/**
 * The API's AES-256-GCM envelope, opened with `node:crypto`.
 *
 * The app opens it with `@noble/ciphers` because it has to run on Hermes;
 * a build script runs on Node, where the same primitive is in the standard
 * library. Both read the same wire format — base64 payload with the auth tag
 * appended, base64 12-byte IV — and the same `EXPO_PUBLIC_API_AES_KEY`.
 */
const openEnvelope = (envelope, key) => {
  const sealed = Buffer.from(envelope.payload, 'base64');
  const iv = Buffer.from(envelope.iv, 'base64');
  if (iv.length !== IV_BYTES) throw new Error('envelope iv is not 12 bytes');
  // Guarded for the same reason `decryptEnvelope` guards it: without this, a
  // short payload reaches `subarray` with a negative offset and comes back as
  // Node's "Invalid authentication tag length", which names the wrong problem.
  if (sealed.length <= AUTH_TAG_BYTES) throw new Error('envelope payload is shorter than its tag');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(sealed.subarray(sealed.length - AUTH_TAG_BYTES));
  const plain = Buffer.concat([
    decipher.update(sealed.subarray(0, sealed.length - AUTH_TAG_BYTES)),
    decipher.final(),
  ]);
  return JSON.parse(plain.toString('utf8'));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One GET against the public API, retried.
 *
 * Retried because the alternative to a transient failure here is a release
 * that silently ships the old undifferentiated pages: the whole point of this
 * script is that a build cannot be trusted to have done it just because the
 * source says so.
 */
const fetchJson = async (baseUrl, key, route) => {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${baseUrl}${route}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        // A 4xx is an answer, not a hiccup — a recipe deleted between the list
        // and its detail will still be gone in two seconds' time.
        const permanent = response.status >= 400 && response.status < 500;
        throw Object.assign(new Error(`HTTP ${String(response.status)} for ${route}`), { permanent });
      }
      const body = await response.json();
      // Public reads come back sealed; an error body may not be.
      return typeof body?.payload === 'string' ? openEnvelope(body, key) : body;
    } catch (error) {
      lastError = error;
      if (error?.permanent === true) break;
      if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
};

/**
 * Every approved recipe the feed would show, across as many pages as it takes.
 *
 * The page count is capped. `summaries.length >= data.total` is the only thing
 * that normally ends this loop, and a backend that stopped honouring `page`
 * would satisfy neither that nor the empty-page check — it would hand back the
 * first twenty rows for ever, and the build would hang against production with
 * nothing to read in the log.
 */
const fetchAllRecipes = async (baseUrl, key) => {
  const summaries = [];
  let page = 1;
  for (;;) {
    const { data } = await fetchJson(baseUrl, key, `/recipes?page=${String(page)}`);
    summaries.push(...data.items);
    if (summaries.length >= data.total || data.items.length === 0) break;
    if (page >= MAX_PAGES) {
      throw new Error(
        `prerender-recipes: still asking for page ${String(page)} of the recipe list — ` +
          `${String(summaries.length)} row(s) fetched against a reported total of ${String(data.total)}`,
      );
    }
    page += 1;
  }

  const recipes = [];
  for (const summary of summaries) {
    const { data } = await fetchJson(baseUrl, key, `/recipes/${encodeURIComponent(summary.id)}`);
    recipes.push(data);
  }
  return recipes;
};

// ------------------------------------------------------------------ content

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** `MIDDLE_EASTERN` → `Middle Eastern`. The API speaks in enum tokens. */
const words = (token) =>
  String(token ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * The recipe's cuisine, or nothing when it says `OTHER`.
 *
 * `OTHER` is the taxonomy's way of declining to answer, and "Other Main Course
 * recipe" reads as a description of a dish nobody chose to write.
 */
const cuisineName = (recipe) => (recipe.cuisine === 'OTHER' ? '' : words(recipe.cuisine));

const totalMinutes = (recipe) =>
  (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

/** ISO-8601 duration, which is the only form schema.org accepts for a time. */
const isoDuration = (minutes) => (minutes > 0 ? `PT${String(minutes)}M` : undefined);

const imageUrl = (recipe) =>
  recipe.image !== '' && recipe.image != null
    ? recipe.image
    : (recipe.media ?? []).find((item) => item.type === 'image')?.url;

/**
 * A sentence about THIS recipe, made mostly of its own words.
 *
 * The API carries no description field — a recipe is its ingredients and its
 * steps — so one is composed from the facts that distinguish it: what kind of
 * dish it is, how long it takes, what goes in it. The connective words are
 * English because the shell declares `lang="en"`; the nouns are the recipe's
 * own, in whatever language it was written.
 */
const describe = (recipe) => {
  const kind = [cuisineName(recipe), words(recipe.category)].filter(Boolean).join(' ');
  const minutes = totalMinutes(recipe);
  const opening = `${recipe.name} — ${kind} recipe`;
  const timing = minutes > 0 ? `, ready in ${String(minutes)} min` : '';
  const yields = recipe.servings > 0 ? `, serves ${String(recipe.servings)}` : '';
  const head = `${opening}${timing}${yields}. `;

  let out = head;
  for (const ingredient of recipe.ingredients) {
    const next = out === head ? `${head}${ingredient}` : `${out}, ${ingredient}`;
    if (next.length > MAX_DESCRIPTION_CHARS) break;
    out = next;
  }
  return out === head ? head.trim() : `${out}.`;
};

/**
 * The recipe as `schema.org/Recipe`.
 *
 * @remarks
 * - **No `aggregateRating`.** Most recipes here are rated 0 by nobody, and the
 *   API reports no rating COUNT at all — a rating block built from that would
 *   be a number Google is entitled to treat as fabricated.
 * - **Absent, not empty.** A field with nothing behind it is dropped rather
 *   than emitted blank: `"image": ""` is a claim about a picture that is not
 *   there.
 */
const structuredData = (recipe) => {
  const image = imageUrl(recipe);
  const minutes = totalMinutes(recipe);
  const nutrition = recipe.nutrition ?? {};
  const grams = (value) => (typeof value === 'number' ? `${String(value)} g` : undefined);

  const nutritionBlock = {
    '@type': 'NutritionInformation',
    calories:
      typeof recipe.caloriesPerServing === 'number' && recipe.caloriesPerServing > 0
        ? `${String(recipe.caloriesPerServing)} calories`
        : undefined,
    proteinContent: grams(nutrition.protein),
    carbohydrateContent: grams(nutrition.carbs),
    fatContent: grams(nutrition.fat),
    fiberContent: grams(nutrition.fiber),
  };
  const { '@type': _type, ...figures } = nutritionBlock;
  const hasNutrition = Object.values(figures).some((value) => value !== undefined);

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    url: `${SITE_URL}/recipes/${recipe.id}`,
    image: image === undefined ? undefined : [image],
    description: describe(recipe),
    recipeCuisine: cuisineName(recipe) || undefined,
    recipeCategory: words(recipe.category) || undefined,
    prepTime: isoDuration(recipe.prepTimeMinutes ?? 0),
    cookTime: isoDuration(recipe.cookTimeMinutes ?? 0),
    totalTime: isoDuration(minutes),
    recipeYield: recipe.servings > 0 ? `${String(recipe.servings)} servings` : undefined,
    datePublished: recipe.createdAt,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text,
    })),
    nutrition: hasNutrition ? nutritionBlock : undefined,
  };
};

/**
 * The same recipe as HTML, for a client that never runs the bundle.
 *
 * In `<noscript>` because the app renders this content itself the moment it
 * mounts, and two copies of it in the live DOM is the thing that would be
 * dishonest. Unstyled on purpose: it is a fallback document, not a second
 * design to keep in step with the first.
 */
const noscriptArticle = (recipe) => {
  const image = imageUrl(recipe);
  const minutes = totalMinutes(recipe);
  const facts = [
    cuisineName(recipe),
    words(recipe.category),
    minutes > 0 ? `${String(minutes)} min` : '',
    recipe.servings > 0 ? `${String(recipe.servings)} servings` : '',
  ].filter(Boolean);

  return [
    '<noscript>',
    '<article>',
    `<h1>${escapeHtml(recipe.name)}</h1>`,
    `<p>${escapeHtml(facts.join(' · '))}</p>`,
    image === undefined
      ? ''
      : `<img src="${escapeHtml(image)}" alt="${escapeHtml(recipe.name)}" width="640" />`,
    '<h2>Ingredients</h2>',
    `<ul>${recipe.ingredients.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
    '<h2>Instructions</h2>',
    `<ol>${recipe.instructions.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`,
    `<p><a href="${SITE_URL}/recipes">More recipes on Recipely</a></p>`,
    '</article>',
    '</noscript>',
  ]
    .filter(Boolean)
    .join('\n');
};

// -------------------------------------------------------------------- pages

/**
 * Substitutes `text` for whatever `pattern`'s single capture group holds.
 *
 * @remarks
 * - **A missing pattern throws.** `String.replace` answers a miss by returning
 *   the string unchanged, which here means a page that quietly keeps the
 *   SITE's description, the site's canonical and the site's Open Graph card —
 *   forty-two undifferentiated pages again, with every gate green, because
 *   `assert-page-titles` guards the title and nothing guards these. The head
 *   these patterns read belongs to `+html.tsx` and will be edited by someone
 *   who has never heard of this script; the build is where they find out.
 * - **A function replacement, not a template string.** `$&` and `$1` are live
 *   substitutions inside a replacement string, and a recipe is free to be
 *   called anything at all — `$5 Pizza` would have replaced itself with a
 *   fragment of the tag it was being written into.
 */
const substitute = (html, pattern, text) => {
  if (!pattern.test(html)) throw new Error(`the export's shell has no ${String(pattern)}`);
  return html.replace(pattern, (_match, before, after) => `${before}${text}${after}`);
};

/** Puts `fragment` immediately before the first `tag`. Same contract. */
const insertBefore = (html, tag, fragment) => {
  if (!html.includes(tag)) throw new Error(`the export's shell has no ${tag}`);
  return html.replace(tag, () => `${fragment}${tag}`);
};

/** Replaces the content of an existing meta tag, matched on its identifying attribute. */
const setMeta = (html, attribute, name, content) =>
  substitute(
    html,
    new RegExp(`(<meta ${attribute}="${name}" content=")[^"]*(")`),
    escapeHtml(content),
  );

/**
 * The exported shell, restated for one recipe.
 *
 * The head is edited rather than appended to: `+html.tsx` already writes a
 * description and a full Open Graph set for the SITE, and a second `og:title`
 * does not override the first — it is simply a page claiming two names.
 */
const pageFor = (shell, recipe) => {
  const canonical = `${SITE_URL}/recipes/${recipe.id}`;
  const description = describe(recipe);
  const image = imageUrl(recipe) ?? `${SITE_URL}/og-image.png`;
  const title = `${recipe.name}${TITLE_SUFFIX}`;

  let html = substitute(shell, /(<title[^>]*>)[\s\S]*?(<\/title>)/, escapeHtml(title));
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = substitute(html, /(<meta property="og:type" content=")[^"]*(")/, 'article');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = substitute(html, /(<link rel="canonical" href=")[^"]*(")/, escapeHtml(canonical));

  // `<` escaped as its unicode form: the JSON is inside a <script>, where a
  // literal `</script>` anywhere in a recipe's own text would close it early.
  const jsonLd = JSON.stringify(structuredData(recipe)).replaceAll('<', '\\u003c');
  html = insertBefore(html, '</head>', `<script type="application/ld+json">${jsonLd}</script>`);
  return insertBefore(html, '</body>', noscriptArticle(recipe));
};

/** Adds every prerendered recipe to the sitemap the export already carries. */
const extendSitemap = (file, recipes) => {
  if (!fs.existsSync(file)) return false;
  const entries = recipes
    .map(
      (recipe) =>
        `  <url>\n    <loc>${SITE_URL}/recipes/${recipe.id}</loc>\n` +
        `    <lastmod>${String(recipe.updatedAt ?? recipe.createdAt).slice(0, 10)}</lastmod>\n` +
        `    <priority>0.7</priority>\n  </url>`,
    )
    .join('\n');
  fs.writeFileSync(file, insertBefore(fs.readFileSync(file, 'utf8'), '</urlset>', `${entries}\n`));
  return true;
};

// --------------------------------------------------------------------- main

const main = async () => {
  if (!fs.existsSync(dist)) {
    console.error(`prerender-recipes: '${dist}' does not exist`);
    process.exit(1);
  }
  if (process.env.APP_VARIANT === 'development') {
    skip('development variant — the dev origin is noindex and talks to another backend');
  }

  const keyHex = (process.env.EXPO_PUBLIC_API_AES_KEY ?? '').toLowerCase();
  if (keyHex === '' || keyHex === UNSET_AES_KEY) {
    // A local `npm run build:web` has no key and must still produce a working
    // export; only the deploy that ships to readers can prerender.
    skip('EXPO_PUBLIC_API_AES_KEY is unset — the API cannot be read');
  }
  if (!/^[0-9a-f]{64}$/.test(keyHex)) {
    console.error('prerender-recipes: EXPO_PUBLIC_API_AES_KEY is not 64 hex characters');
    process.exit(1);
  }

  // The dynamic route's own shell, which is what Expo emits for this route and
  // what hosting would otherwise never serve.
  const shellPath = [
    path.join(dist, 'recipes', '[recipeId].html'),
    path.join(dist, 'index.html'),
  ].find((candidate) => fs.existsSync(candidate));
  if (shellPath === undefined) {
    console.error('prerender-recipes: the export has no shell to build from');
    process.exit(1);
  }
  const shell = fs.readFileSync(shellPath, 'utf8');

  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_API_BASE_URL;
  const all = await fetchAllRecipes(baseUrl, Buffer.from(keyHex, 'hex'));

  const recipes = all.filter(
    (recipe) =>
      recipe.moderationStatus === 'approved' &&
      (recipe.ingredients ?? []).length >= MIN_INGREDIENTS &&
      (recipe.instructions ?? []).length >= MIN_INSTRUCTIONS,
  );

  for (const recipe of recipes) {
    const dir = path.join(dist, 'recipes', recipe.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageFor(shell, recipe));
  }

  const listed = extendSitemap(path.join(dist, 'sitemap.xml'), recipes);
  console.log(
    `prerender-recipes: wrote ${String(recipes.length)} recipe page(s) of ${String(all.length)}` +
      `, from ${path.relative(dist, shellPath)}${listed ? ', sitemap extended' : ''}`,
  );
};

await main();
