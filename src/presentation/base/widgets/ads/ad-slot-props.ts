/**
 * The contract both builds of {@link AdSlot} answer to.
 *
 * Its own file because the native and web slots are a platform pair, and a
 * props interface declared twice is the half of the pair that drifts
 * (CLAUDE.md rule 13).
 */
export interface AdSlotProps {
  /** AdMob ad unit id for this placement. Ignored by the web build. */
  unitId: string;
  /** Read by a screen reader in place of the ad's own content. */
  accessibilityLabel: string;
  /**
   * Width to request the adaptive banner at, in dp. Omitted, the SDK asks for
   * the DEVICE width, which renders past the padding of whatever container the
   * slot sits in. Ignored by the web build, where the unit is sized by its box.
   */
  width?: number;
}
