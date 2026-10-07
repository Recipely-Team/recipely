/**
 * What a measure unit measures. Only units of the same dimension convert into
 * each other — a cup of flour is a volume, and without a density table it
 * never becomes grams.
 */
export const MeasureDimension = {
  Mass: 'mass',
  Volume: 'volume',
  /** Pieces, cloves, bunches, pinches, packs: scalable, never convertible. */
  Count: 'count',
} as const;

export type MeasureDimensionType = (typeof MeasureDimension)[keyof typeof MeasureDimension];
