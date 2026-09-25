/**
 * What removing a recipe's cover left behind.
 *
 * `image` is the new cover — the next gallery photo, or empty when there was
 * none — and `removedMediaIds` every gallery row the old cover appeared as.
 */
export interface CoverRemoval {
  image: string;
  removedMediaIds: readonly string[];
}
