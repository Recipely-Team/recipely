import Constants from "expo-constants";

/**
 * Which backend the app talks to, and the URLs that sit outside `/api/v1`.
 *
 * @remarks
 * - **Variant** — `app.config.ts` injects `extra.variant` from `APP_VARIANT` at
 *   config-evaluation time, so the dev build (`com.recipely.app.dev`) reaches
 *   the dev backend and the production build reaches prod. Unset means
 *   production, which is what unit tests get from the static `app.json`.
 * - **Overrides** — `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_WEB_APP_URL` win
 *   over both defaults; the first keeps its historical name so devices already
 *   shipping with that override keep working.
 * - **Paging, timeouts and build secrets** have their own modules beside this
 *   one — `api-paging`, `api-timeouts`, `build-secrets` — so a reader looking
 *   for "how big is a page" is not scrolling past host resolution to find it.
 */
const IS_DEV_VARIANT: boolean =
  Constants.expoConfig?.extra?.variant === "development";

const PROD_SERVER_URL = "https://api.recipely.net";
const DEV_SERVER_URL = "https://dev-api.recipely.net";
const DEFAULT_SERVER_URL = IS_DEV_VARIANT ? DEV_SERVER_URL : PROD_SERVER_URL;

const SERVER_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_SERVER_URL;

/** Unversioned on the backend — mounted on the Express app, not under /api/v1. */
export const HEALTH_URL: string = `${SERVER_URL}/health`;

/** `HttpClient.baseURL`: every relative `url:` in a repository resolves under here. */
export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;

/** Absolute, because avatar upload sits at the server root and must bypass `baseURL`. */
export const AVATAR_UPLOAD_URL: string = `${SERVER_URL}/me/avatar`;

const PROD_WEB_APP_BASE_URL = "https://recipely.net";
const DEV_WEB_APP_BASE_URL = "https://app-recipely-dev.web.app";
const DEFAULT_WEB_APP_BASE_URL = IS_DEV_VARIANT
  ? DEV_WEB_APP_BASE_URL
  : PROD_WEB_APP_BASE_URL;

/** Public web origin (the universal-link domain), not the API server. */
const WEB_APP_BASE_URL: string =
  process.env.EXPO_PUBLIC_WEB_APP_URL?.replace(/\/$/, "") ??
  DEFAULT_WEB_APP_BASE_URL;

/** Always production: the legal text is environment-independent and dev doesn't serve it. */
export const PRIVACY_POLICY_URL: string = `${PROD_WEB_APP_BASE_URL}/privacy`;
export const TERMS_OF_USE_URL: string = `${PROD_WEB_APP_BASE_URL}/terms`;

/** Shareable canonical URL for a recipe — opens the app's recipes/[recipeId] route. */
export const recipeWebUrl = (recipeId: string): string =>
  `${WEB_APP_BASE_URL}/recipes/${recipeId}`;

/** Used only when the response omits both `expiresAt` and `expiresInSeconds`. */
export const DEFAULT_CODE_TTL_SECONDS = 180;
