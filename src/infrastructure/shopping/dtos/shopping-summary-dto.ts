/** `GET /me/shopping-list/summary` (backend #394). */
export interface ShoppingSummaryDto {
  /** Lines not yet ticked. */
  unchecked: number;
}
