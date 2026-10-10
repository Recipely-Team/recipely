/** How far a group of comment-to-DM attempts got: matched → sent → recipe opened → recipe saved. */
export interface FunnelCounts {
  /** Comments that matched a rule — every attempt. */
  readonly matched: number;
  readonly sent: number;
  /** Taps on the recipe link inside the DM (first tap per DM). */
  readonly opened: number;
  /** That recipe saved after arriving through the DM. */
  readonly saved: number;
}
