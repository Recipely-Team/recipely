/** What a post is. Also the wire values. */
export const InstagramMediaType = {
  Image: 'IMAGE',
  Video: 'VIDEO',
  Carousel: 'CAROUSEL_ALBUM',
} as const;

export type InstagramMediaTypeType = (typeof InstagramMediaType)[keyof typeof InstagramMediaType];
