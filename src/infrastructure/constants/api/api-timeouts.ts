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


/** Generate/refine call the model synchronously; no download, so below the import budget. */
export const AI_REQUEST_TIMEOUT_MS = 90_000;

/** A 3 MB JPEG at 1 Mbps is ~25s — multipart needs its own budget. */
export const MULTIPART_UPLOAD_TIMEOUT_MS = 60_000;

/**
 * A file reading takes 10-30 s and the backend gives up at 60 s; the extra ten
 * cover uploading up to five photos, so its own answer arrives before ours.
 */
export const FILE_IMPORT_TIMEOUT_MS = 70_000;

/**
 * The backoff ceiling of a read's first retry after a timeout, a dropped
 * connection or a 502/503/504; it doubles per retry up to {@link READ_RETRY_CAP_MS}.
 * Long enough for a restarting API to answer.
 */
export const READ_RETRY_BASE_MS = 800;

/** No read waits longer than this between two tries. */
export const READ_RETRY_CAP_MS = 4_000;

/** Retries for a read that failed fast (dropped connection, 502/503/504) — three tries in all. */
export const READ_RETRIES = 2;

/** A read that timed out already cost the user the full timeout; it gets one retry, not two. */
export const READ_TIMEOUT_RETRIES = 1;

/**
 * Web: how long a refresh the API refused waits before asking once more. Two
 * tabs refreshing together share one cookie; the loser is refused, and by now
 * the winner's reply has put the successor token in the cookie jar.
 */
export const REFRESH_RACE_RETRY_MS = 1_000;

/**
 * The longest an attested request waits for its proof before going without one.
 * The first proof on iOS registers a key (two API calls and Apple's attestation),
 * so it can miss this once; the registration finishes in the background.
 */
export const ATTESTATION_TIMEOUT_MS = 3_000;
