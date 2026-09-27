import type { MediaType } from '@domain/recipes/media/media-type';
import type { FocalPoint } from '@domain/recipes/media/focal-point';

export interface MediaItem {
  /**
   * The row's id on the server, absent while the photo is only on the device.
   *
   * Optional because both are real: the draft editor holds pictures the user
   * has picked and not yet published, and those have no row to have an id. It
   * is what tells the two apart — and only a photo that HAS one can be removed
   * from a published recipe, because removing is a request about a row.
   */
  id?: string;
  type: MediaType;
  url: string;
  /** Where the dish sits in this photo; absent until the backend has found it, which reads as centred. */
  focus?: FocalPoint;
}
