/**
 * Custom expo-router route context enabling page co-location (architecture.md
 * §Presentation structure). metro.config.js aliases `expo-router/_ctx` to this
 * file, so ONLY the following files become routes:
 *
 *   - `index.tsx` at any depth        → the page component of its folder
 *   - `_layout.tsx` at any depth      → layouts
 *   - `_sitemap.tsx` at the app root  → replaces expo-router's own dev screen
 *   - `+special.tsx` (e.g. +not-found), `[param].tsx`
 *
 * Everything else under `presentation/app/` (body/, items/, sheets/, hooks/,
 * model/, __tests__/, shared/, …) is co-located page code and is ignored by
 * the router. A new page is therefore always `app/<segment>/index.tsx`; a flat
 * `app/<segment>.tsx` file will NOT register (scripts/check-structure.mjs
 * flags loose files at the app root for this reason).
 *
 * The regex mirrors the stock `expo-router/_ctx` exclusions for `+api`,
 * `+middleware`, root `+html`, and platform suffixes.
 *
 * `+native-intent` is deliberately NOT excluded, and the exclusion list is the
 * whole reason to say so. expo-router reads that file back out of THIS context
 * — `getLinkingConfig` does `ctx.keys().find(k => k.match(/^\.\/\+native-intent/))`
 * — so a context that hides it does not merely skip a route, it silently drops
 * `redirectSystemPath`. The iOS share extension opens the app on
 * `recipely-dev://dataUrl=<key>?nonce=…`, which is exactly the URL that hook
 * exists to rewrite; without it every "Share to Recipely" landed on Unmatched
 * Route. Upstream makes the same distinction — only `_ctx.web.js` excludes
 * `+native-intent`; `_ctx.ios.js` / `_ctx.android.js` admit it — and it never
 * becomes a route either way, because `getRoutesCore` drops `+html` and
 * `+native-intent` from the route tree itself. Admitting it on web too is
 * harmless: `redirectSystemPath` passes any non-share URL straight through.
 * Guarded by `check:structure` rule Q.
 *
 * `_sitemap` is admitted for the same class of reason as `+native-intent`, and
 * it is a crash rather than a missing feature. expo-router appends its OWN
 * `_sitemap` route whenever the context does not supply one
 * (`getRoutesCore.js`: `if (!directory.files.has('_sitemap'))`), and that screen
 * renders `SystemInfo`, which reads `window.location.origin`. There is no
 * `window.location` on native, so reaching `/_sitemap` on a device is a fatal
 * `TypeError: Cannot read property 'origin' of undefined` — a developer screen,
 * shipped, that kills the app. Nothing in the app links to it; a crawler that
 * walks routes finds it, and Crashlytics logged exactly that from an emulator.
 * There is no config switch: `qualified-entry.js` renders `<ExpoRoot>` with no
 * `config` prop, so `sitemap` is always its `true` default. Supplying the route
 * ourselves is the only supported way to take that screen out of a build.
 * Guarded by `check:structure` rule Z.
 *
 * The app-dir argument MUST stay a hard-coded relative path, NOT
 * `process.env.EXPO_ROUTER_APP_ROOT`: @expo/cli resets the `routerRoot`
 * transform option to its default `'app'` for every file outside
 * `expo-router/_ctx*` / `expo-router/build/` (pruneCustomTransformOptions in
 * instantiateMetro.js, a cache-key optimisation), so in THIS file babel would
 * inline a path to the non-existent `<project>/app` folder — the context then
 * matches zero files and the router throws "No routes found" at runtime.
 */
export const ctx = require.context(
  '../app',
  true,
  /^\.\/(?!(?:.*\+api|\+middleware|\+html)\.[tj]sx?$)(?:.*\/)?(?:index|_layout|_sitemap|\+[\w-]+|\[[^/\]]+\])(?:\.(?:android|ios|native|web))?\.[tj]sx?$/,
  process.env.EXPO_ROUTER_IMPORT_MODE
);
