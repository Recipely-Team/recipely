/**
 * What a photo may weigh by the time it leaves the device.
 *
 * @remarks
 * - **Why the app bounds this at all.** Publishing a recipe with a photo taken
 *   on a recent phone failed with `errors.validation.file_too_large`: the picker
 *   hands back the original capture — several megabytes at 4000px — and nothing
 *   between it and the multipart body ever looked at the size.
 * - **The budget these numbers serve.** The limit that rejects an upload is
 *   whichever is smallest along the path: Multer's `limits.fileSize` and the
 *   reverse proxy's body cap — `client_max_body_size`, whose nginx default is
 *   1 MB and applies to the WHOLE request, not one part. A recipe may carry ten
 *   photos, so the target is a few hundred KB each rather than "under the
 *   per-file limit". A 1600px JPEG at 0.7 lands there with room to spare.
 * - **Dimensions first, quality second.** Re-encoding a 4032px photo at low
 *   quality keeps every pixel and only looks soft. Bounding the long edge is
 *   what removes the bytes; quality closes the rest of the gap.
 * - **Why not measure and iterate.** Reading the encoded size back means either
 *   another native dependency or a `fetch` on a `file://` URI, and both buy
 *   precision the budget does not need — the ceiling here is fixed, not
 *   per-image.
 */
export const MEDIA_UPLOAD_MAX_EDGE = 1600;

/** JPEG quality applied after the resize. */
export const MEDIA_UPLOAD_QUALITY = 0.7;
