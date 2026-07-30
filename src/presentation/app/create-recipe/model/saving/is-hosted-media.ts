import type { MediaItem } from '@domain/recipes/media/media-item';
import { RegexConstants } from '@core/constants';

/**
 * True when the item is already served by a backend rather than sitting on the
 * device.
 *
 * The editor's gallery mixes two kinds of thing that look identical in the UI.
 * A photo the user picked has a device URI (`file:`, `content:`, `ph:`, or a
 * `blob:` on web) and has to be uploaded. A cover the Instagram importer lifted
 * out of the video is an `https:` URL the backend already stored — uploading it
 * would mean fetching a file the device never had, and re-storing bytes the
 * server already has.
 */
export const isHostedMedia = (item: MediaItem): boolean =>
  RegexConstants.absoluteHttpUrl.test(item.url);
