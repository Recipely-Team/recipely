import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Sizes and timings only the assistant's chrome reads.
 *
 * @remarks
 * - **These are not theme tokens** because nothing else in the app is shaped
 *   like this surface: a mascot launcher, a waveform and a docked panel exist
 *   once. Rule 5's test is reuse, not type — promoting them to
 *   `@presentation/base/theme` would put five names in a shared module that
 *   only ever answer one widget's questions.
 * - **The bar counts differ per context on purpose.** The mini bar is a glance
 *   and the panel is the stage, so the same waveform drawn at the same density
 *   in both read as one squashed and one sparse.
 * - **The web panel is a full-height column, not a box that hugs its content.**
 *   Docked to the bottom edge with only the height its transcript needed, an
 *   empty conversation rendered as a strip barely taller than its own footer.
 *   `panelWebMaxHeight` caps it: a desktop viewport is tall enough that a
 *   full-height column pushed the name chip and the control bar to opposite
 *   edges with the page between them, which reads as two loose objects rather
 *   than one conversation. `panelWebTopClearance` is the room the site HEADER
 *   wants above it, so it is
 *   spent only where that header is mounted — a tablet is wide without being a
 *   browser. `panelMinHeight` is the floor: a short window subtracted its way
 *   past zero without one.
 * - **The resting orb has to be visibly alive.** It was drifting three pixels
 *   over five seconds, which is not a slow animation — it is a still image. The
 *   aura, the orbit and the waveform all belong to a LIVE session and correctly
 *   are not drawn otherwise, so those five seconds were the entire animated
 *   vocabulary of an orb sitting on a phone with no session running, and the
 *   app read as frozen. A breath is seven pixels and two and a half percent of
 *   scale, on a period a person breathes at.
 * - **`levelSettleMs` matches the store's publish interval.** Level arrives at
 *   most every 80ms; animating over roughly that long turns a staircase into a
 *   line without adding lag the user can feel.
 */
export const assistantMetrics = {
  fab: scale(58),
  fabMascot: scale(40),
  miniMascot: scale(30),
  headerMascot: scale(24),
  bubbleMascot: scale(19),
  waveBarWidth: scale(2),
  waveBarGap: scale(2),
  waveMiniBars: 16,
  waveMiniHeight: scale(16),
  wavePanelBars: 42,
  wavePanelHeight: scale(30),
  panelWebWidth: scale(400),
  panelWebTopClearance: scale(84),
  panelMinHeight: scale(280),
  panelWebMaxHeight: scale(520),
  orb: scale(104),
  orbHalo: scale(126),
  orbMascot: scale(84),
  orbLevelGrowth: 0.14,
  orbBobTravel: scale(7),
  orbBobMs: 2_800,
  orbBreathGrowth: 0.025,
  orbSpeakingBobMs: 1_600,
  orbGlowMs: 3_600,
  orbSpeakingGlowMs: 1_500,
  orbSweepMs: 1_100,
  orbRing: scale(112),
  orbRingMs: 2_600,
  orbSpeakingRingMs: 1_700,
  orbRingGrowth: 1.28,
  orbOrbit: scale(118),
  orbOrbitMs: 6_000,
  orbSpeakingOrbitMs: 3_600,
  orbWaveBars: 7,
  orbWaveHeight: scale(12),
  orbLeadPoint: scale(6),
  orbPoint: scale(4),
  menuPillHeight: scale(34),
  sheetHeightShare: 0.46,
  /**
   * The shortest the typing sheet may be: the grabber, the composer and a
   * line or two of what was said. A landscape phone with the keyboard up has
   * less room than the share asks for, and a sheet too short to type into is
   * worse than one that overlaps the orb.
   */
  sheetMinHeight: scale(168),
  panelSheetHeightShare: 0.52,
  levelSettleMs: 90,
  blinkIntervalMs: 3600,
  blinkDurationMs: 120,
  bobDurationMs: 1400,
  bobTravel: scale(2),
  ringDurationMs: 2600,
  ringScale: 1.6,
} as const;
