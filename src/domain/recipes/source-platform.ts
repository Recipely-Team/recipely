/**
 * Which video platform an imported recipe was lifted from.
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
} as const;

export type SourcePlatformType = (typeof SourcePlatform)[keyof typeof SourcePlatform];
