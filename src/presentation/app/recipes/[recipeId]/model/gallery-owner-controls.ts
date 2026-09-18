/**
 * The two controls only the recipe's owner is offered: add a photo, remove the
 * one on screen.
 *
 * In the page's `model/` because two layouts now hand it around — the mobile
 * gallery and the web hero. It lived inside `media-gallery.tsx` while that was
 * the only place it existed, and the comment there said so; the web detail
 * drawing its own hero is what made it a shared shape rather than a local one.
 */
export interface GalleryOwnerControls {
  onAdd: () => void;
  /** Asked about the photo on screen; the screen confirms before anything goes. */
  onRemove: (mediaId: string) => void;
  isBusy: boolean;
}
