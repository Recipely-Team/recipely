/**
 * The shade across the bottom of a card's cover, so the chips there read on a
 * white plate: clear down to 60%, then darkening to the edge. Stops and
 * direction are one gradient and live together.
 */
export const cardCoverScrim = {
  // Tuple-typed: LinearGradient's `locations` requires at least two stops.
  locations: [0.6, 1] as readonly [number, number, ...number[]],
  start: { x: 0, y: 0 } as const,
  end: { x: 0, y: 1 } as const,
} as const;
