import { ValueConstants } from '@core/constants';

/**
 * Whether the thumbnail strip is drawn under the hero: when there is more than
 * one photo to choose between, or when the owner has one and needs the strip
 * for its Add tile and Cover band.
 */
export const showsPhotoStrip = (count: number, isOwner: boolean): boolean =>
  count > ValueConstants.one || (isOwner && count >= ValueConstants.one);
