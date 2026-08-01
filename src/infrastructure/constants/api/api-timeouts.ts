/**
 * How long the app waits before giving up on a request.
 *
 * @remarks
 * The 10s default aborts requests the backend would have completed, and the
 * user reads that as "Network error". Anything slow by nature gets its own
 * budget: video import (~120s server-side), the synchronous LLM calls, and
 * multipart on cellular.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

/** 10s of headroom over the backend's ~120s yt-dlp + Whisper + vision budget. */
export const IMPORT_REQUEST_TIMEOUT_MS = 130_000;

/** Generate/refine call the model synchronously; no download, so below the import budget. */
export const AI_REQUEST_TIMEOUT_MS = 90_000;

/** A 3 MB JPEG at 1 Mbps is ~25s — multipart needs its own budget. */
export const MULTIPART_UPLOAD_TIMEOUT_MS = 60_000;
