/**
 * What the provenance seal sits on, which decides its ring.
 *
 * A photo can be any brightness, so there the seal wears a dark ring that
 * holds against a white pixel; on the app's own surface a hairline is enough.
 */
export const SealSurface = {
  Photo: 'photo',
  Page: 'page',
} as const;

export type SealSurfaceType = (typeof SealSurface)[keyof typeof SealSurface];
