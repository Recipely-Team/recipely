import { scale } from '@presentation/base/theme';

/** The Chefs "coming soon" placeholder's geometry, as the Recipely Prototype draws it (design spec → Chefs coming soon). */
export const ChefsSoonMetrics = {
  /** The placeholder's widest — a phone-width column, centred on a wide viewport. */
  maxWidth: scale(480),
  /** The hero illustration's box. */
  heroWidth: scale(200),
  heroHeight: scale(176),
  /** The three stacked circles, outer to inner. */
  haloOuter: scale(176),
  haloInner: scale(128),
  core: scale(88),
  /** The chef hat inside the core. */
  coreGlyph: scale(44),
  /** A floating food chip and its glyph. */
  chip: scale(36),
  chipGlyph: scale(18),
  /** Where the four chips sit in the hero box, and their stagger (ms). */
  chipSpots: [
    { icon: 'restaurant-outline', left: scale(4), top: scale(22), delay: 0 },
    { icon: 'heart-outline', right: scale(4), top: scale(10), delay: 800 },
    { icon: 'star-outline', left: scale(12), bottom: scale(14), delay: 1600 },
    { icon: 'flame-outline', right: scale(10), bottom: scale(30), delay: 2400 },
  ],
  /** How far a chip bobs, and one full bob. */
  bobDistance: scale(5),
  bobMs: 3200,
  /** "Coming soon" pill height. */
  pill: scale(26),
  /** The body line's widest. */
  bodyMaxWidth: scale(300),
  /** The ghost cards' bars: heights and widths, top to bottom. */
  ghostBarHeights: [scale(12), scale(10), scale(8)],
  ghostBarWidths: ['62%', '46%', '54%'],
  /** The ghost grid's opacity, and where its fade to the background starts. */
  ghostOpacity: 0.6,
  ghostFadeFrom: 0.35,
  /** How far the creator card rides up over the faded grid. */
  ctaOverlap: scale(72),
} as const;
