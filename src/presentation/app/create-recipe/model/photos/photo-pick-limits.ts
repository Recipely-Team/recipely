/** Bytes in a megabyte, as file sizes are reported. */
const MEGABYTE = 1024 * 1024;

/**
 * What the editor accepts from the picker.
 *
 * A file past the size cap is skipped and said so under the grid, rather than
 * handed to a re-encode that would stall on it. There is no cap on how many
 * photos a recipe may have — the prototype has none, so the editor has none.
 */
export const photoPickLimits = {
  maxBytes: 25 * MEGABYTE,
} as const;
