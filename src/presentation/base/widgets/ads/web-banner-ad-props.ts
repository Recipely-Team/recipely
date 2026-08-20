/**
 * The contract both builds of {@link WebBannerAd} answer to.
 *
 * Its own file because the native and web builds are a platform pair, and a
 * props interface declared twice is the half of the pair that drifts
 * (CLAUDE.md rule 13).
 */
export interface WebBannerAdProps {
  /** AdSense display-unit id. Blank renders nothing; ignored by the native build. */
  slotId: string;
  /** Read by a screen reader in place of the ad's own content. */
  accessibilityLabel: string;
}
