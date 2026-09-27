/**
 * When the recipe detail's stat tiles fold from one row into two columns.
 *
 * @remarks
 * - **Measured on the card, not the window.** The card's width is what the
 *   labels have to fit in; a window check misfires the moment the card sits
 *   in a padded column or a split view.
 * - **330 is where four tiles stop fitting their labels.** Below it a quarter
 *   of the card is ~80pt, and "PREPARATION" or "DIFFICULTY" in a wider script
 *   no longer fits on two lines.
 */
export const statGrid = {
  /** A card this wide or narrower lays its tiles out two to a row. */
  narrowMaxWidth: 330,
  narrowColumns: 2,
} as const;
