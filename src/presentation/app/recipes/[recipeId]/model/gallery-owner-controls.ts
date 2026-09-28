/**
 * The two controls only the recipe's owner is offered: add a photo, remove the
 * one on screen.
 *
 * In the page's `model/` because two layouts now hand it around — the mobile
 * gallery and the web hero. It lived inside `media-gallery.tsx` while that was
 * the only place it existed, and the comment there said so; the web detail
 * drawing its own hero is what made it a shared shape rather than a local one.
 */
import type { MediaItem } from '@domain/recipes/media/media-item';

export interface GalleryOwnerControls {
  onAdd: () => void;
  /**
   * Asked about the photo on screen — any of them, the cover included; the
   * screen confirms before anything goes.
   */
  onRemove: (item: MediaItem) => void;
  isBusy: boolean;
}
