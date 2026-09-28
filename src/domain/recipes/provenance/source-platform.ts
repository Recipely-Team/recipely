/**
 * Where an imported recipe was lifted from: a video platform, or a web page.
 *
 * @remarks
 * - **Independent of `RecipeOrigin`.** They answer different questions, and one
 *   enum could only answer one at a time: an import came from an account AND
 *   was written by a model, since the model is what turns a video into a
 *   recipe. See [[RecipeOrigin]] for the other half.
 * - **`null` when nothing was imported**, which is most recipes.
 */
export const SourcePlatform = {
  Instagram: 'INSTAGRAM',
  TikTok: 'TIKTOK',
  /** A Facebook video or reel. The handle is the page's display name, never an `@`. */
  Facebook: 'FACEBOOK',
  /** A YouTube video or short. The handle is the channel's display name. */
  YouTube: 'YOUTUBE',
  /** Any recipe web page, read from its own schema.org markup. The handle is the site. */
  Web: 'WEB',
} as const;

export type SourcePlatformType = (typeof SourcePlatform)[keyof typeof SourcePlatform];
