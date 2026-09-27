import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';

/**
 * The five sources a link import accepts, in the order the prototype lines
 * them up on the import screen and on the create screen's entry card.
 *
 * One list for both, so the card never promises a source the screen it opens
 * leaves out.
 */
export const ACCEPTED_IMPORT_MARKS = [
  ProvenanceMark.Instagram,
  ProvenanceMark.TikTok,
  ProvenanceMark.YouTube,
  ProvenanceMark.Facebook,
  ProvenanceMark.Web,
] as const;
