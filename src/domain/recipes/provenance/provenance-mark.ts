/**
 * One mark on a recipe's provenance seal.
 *
 * @remarks
 * - **Two independent facts, one list.** A platform mark says where the video
 *   came from; the AI mark says a model wrote the text. An import from TikTok
 *   that a model turned into a recipe carries both, platform first.
 * - **Values match `SourcePlatform` where they overlap**, so a platform maps to
 *   its mark without a lookup table.
 */
export const ProvenanceMark = {
  Instagram: 'INSTAGRAM',
  TikTok: 'TIKTOK',
  Ai: 'AI',
} as const;

export type ProvenanceMarkType = (typeof ProvenanceMark)[keyof typeof ProvenanceMark];
