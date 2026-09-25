/**
 * How fast the reading checklist creeps forward. A reading takes 10-30 s and
 * reports nothing until it is done, so the list walks on a clock — and stops
 * one short of the end until the draft actually exists.
 */
export const FILE_STAGE_TICK_MS = 6000;
