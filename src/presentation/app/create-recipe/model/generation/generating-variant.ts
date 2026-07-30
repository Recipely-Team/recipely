/**
 * `generate` drives a text prompt → recipe; `import` drives an Instagram reel →
 * recipe (different copy and step labels, and a longer-running last step that
 * keeps pulsing rather than completing).
 */
export const GeneratingVariant = {
  Generate: 'generate',
  Import: 'import',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type GeneratingVariant = (typeof GeneratingVariant)[keyof typeof GeneratingVariant];
