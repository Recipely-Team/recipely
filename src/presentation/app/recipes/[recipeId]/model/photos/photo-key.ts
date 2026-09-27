import type { MediaItem } from '@domain/recipes/media/media-item';

/**
 * A photo's React key in the pager and the thumb strip: its server id, else its url.
 *
 * @remarks
 * - **Never the index** (rule 9) — removing photo 0 would shift every later key
 *   and remount each image, flashing the whole row.
 * - **Unique without the index** — every gallery row has an id, so two photos
 *   sharing a url still differ. Only the cover fallback (`heroPhotos` with an
 *   empty gallery) lacks one, and it is always alone.
 */
export const photoKey = (item: MediaItem): string => item.id ?? item.url;
