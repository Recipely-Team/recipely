/** How far each voice moves the orb, as a share of its size. */
export const OrbMotion = {
  /** The assistant's glow grows this much at full level. */
  assistantGlowGrowth: 0.45,
  /** The user's ring grows this much at full level. */
  userRingGrowth: 0.3,
  glowOpacity: 0.35,
  ringOpacity: 0.55,
  ringBorder: 3,
  mutedOpacity: 0.45,
  pulseMs: 900,
  pulseLow: 0.55,
} as const;
