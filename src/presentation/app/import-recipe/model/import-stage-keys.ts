import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';

const VIDEO_STAGE_KEYS = ['stage0', 'stage1', 'stage2', 'stage3'] as const;
const WEB_STAGE_KEYS = ['webStage0', 'webStage1', 'webStage2'] as const;

/**
 * The checklist a platform's import walks through, as copy keys.
 *
 * A web page has no video to download or audio to transcribe: it is opened,
 * its recipe markup read, and the draft filled — three stages, not four.
 */
export const importStageKeysFor = (
  platform: SourcePlatformType,
): readonly ((typeof VIDEO_STAGE_KEYS)[number] | (typeof WEB_STAGE_KEYS)[number])[] =>
  platform === SourcePlatform.Web ? WEB_STAGE_KEYS : VIDEO_STAGE_KEYS;
