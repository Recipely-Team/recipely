/**
 * Assembles the assistant bubble shown after a successful refine: the AI's
 * `summary` of what changed, plus its `suggestion` on a blank-line-separated
 * paragraph. Empty/whitespace-only strings count as absent; when no summary
 * arrived (older backend) the caller-provided i18n fallback takes its place.
 */
import { ValueConstants } from '@core/constants';

export const buildRefineReply = (
  refined: { summary?: string; suggestion?: string },
  fallback: string,
): string => {
  const summary = refined.summary?.trim();
  const suggestion = refined.suggestion?.trim();
  const lead = summary !== undefined && summary.length > ValueConstants.zero ? summary : fallback;
  if (suggestion !== undefined && suggestion.length > ValueConstants.zero) return `${lead}\n\n${suggestion}`;
  return lead;
};
