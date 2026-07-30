import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Non-interactive ornament: badges, status discs, indicator dots, decorative
 * gradients. Split out from `controlSizes` on purpose — nothing here is a tap
 * target, so none of it is bound by the 44pt minimum-touch-size rule and none
 * of it needs to grow with its content.
 *
 * ORDER: strictly ascending by value, enforced by a test (see `controlSizes`
 * for why).
 */
export const decorSizes = {
  /**
   * Line box that vertically centers the count inside {@link notifBadge}
   * (its 14pt inner box after the 2pt border).
   */
  notifBadgeLineHeight: scale(12),
  /** Unread-count badge on a tab or bell icon. */
  notifBadge: scale(18),
  /** Width of the active page dot in a carousel (the inactive dot is round). */
  dotActiveWidth: scale(18),
  /** Rank medallion on the web leaderboard cards. */
  rankBadge: scale(26),
  /** Numbered step / count badge. */
  badgeSm: scale(28),
  /** Card overlap onto the hero above it. */
  cardOverlap: scale(40),
  /** Circular icon plate on the AI banner. */
  aiBannerIcon: scale(52),
  /** Severity disc behind the icon in a FeedbackDialog. */
  feedbackDisc: scale(64),
  /** Success/error status circle on the reset-password views. */
  statusCircle: scale(72),
  /** Sparkle ornament on the AI surfaces. */
  sparkleDecor: scale(80),
  /** Scrim gradient over a hero image. */
  gradientHeight: scale(260),
} as const;
