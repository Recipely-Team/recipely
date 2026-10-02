import type { InstagramMediaTypeType } from '@domain/instagram/instagram-media-type';

/** A post or Reel on the connected account — what a rule is attached to. */
export interface InstagramMedia {
  readonly id: string;
  readonly mediaType: InstagramMediaTypeType;
  readonly thumbnailUrl: string | null;
  readonly caption: string | null;
  readonly permalink: string | null;
}
