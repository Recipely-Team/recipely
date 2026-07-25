/**
 * `generate` drives a text prompt → recipe; `import` drives an Instagram reel →
 * recipe (different copy and step labels, and a longer-running last step that
 * keeps pulsing rather than completing).
 */
export type GeneratingVariant = 'generate' | 'import';
