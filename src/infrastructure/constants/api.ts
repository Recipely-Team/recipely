import Constants from "expo-constants";

/**
 * Every host, endpoint, page size and request budget the app talks to the
 * backend with.
 *
 * @remarks
 * - **Variant** — `app.config.ts` injects `extra.variant` from `APP_VARIANT` at
 *   config-evaluation time, so the dev build (`com.recipely.app.dev`) reaches
 *   the dev backend and the production build reaches prod. Unset means
 *   production, which is what unit tests get from the static `app.json`.
 * - **Overrides** — `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_WEB_APP_URL` win
 *   over both defaults; the first keeps its historical name so devices already
 *   shipping with that override keep working.
 * - **Timeouts** — the 10s JSON default aborts requests the backend would have
 *   completed, and the user reads that as "Network error". Anything slow by
 *   nature gets its own budget: video import (~120s server-side), the
 *   synchronous Gemini calls, and multipart on cellular.
 * - **`API_AES_KEY_HEX`** — must equal the backend's `API_AES_KEY`. It ships
 *   inside the binary and is extractable by reverse engineering; TLS is the
 *   real transport-layer protection, this envelope is not.
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
export const WEB_APP_BASE_URL: string =
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

/** Backend caps `limit` at 1–30. */
export const TRENDING_RECIPES_LIMIT = 10;

/** The API is 1-based; this is the page every unqualified request means. */
export const FIRST_PAGE = 1;

export const RECIPES_PAGE_SIZE = 30;

export const MY_RECIPES_PAGE_SIZE = 20;

export const DRAFTS_PAGE_SIZE = 20;

/** The saved grid has no paging UI, so this is the ceiling on what a user can see. */
export const FAVORITES_PAGE_SIZE = 100;

export const COMMENTS_PAGE_SIZE = 20;

export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

/** 10s of headroom over the backend's ~120s yt-dlp + Whisper + vision budget. */
export const IMPORT_REQUEST_TIMEOUT_MS = 130_000;

/** Generate/refine call Gemini synchronously; no download, so below the import budget. */
export const AI_REQUEST_TIMEOUT_MS = 90_000;

/** A 3 MB JPEG at 1 Mbps is ~25s — multipart needs its own budget. */
export const MULTIPART_UPLOAD_TIMEOUT_MS = 60_000;

const DEFAULT_AES_KEY_HEX =
  "0000000000000000000000000000000000000000000000000000000000000000";

/** Override at build time via `EXPO_PUBLIC_API_AES_KEY` (`openssl rand -hex 32`). */
export const API_AES_KEY_HEX: string =
  process.env.EXPO_PUBLIC_API_AES_KEY?.toLowerCase() ?? DEFAULT_AES_KEY_HEX;

/** Firebase Console → Authentication → Sign-in method → Google, "Web client". */
export const GOOGLE_WEB_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
