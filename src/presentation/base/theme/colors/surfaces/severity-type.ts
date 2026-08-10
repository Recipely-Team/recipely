/**
 * Severity is the semantic role of a feedback surface, independent of the app's
 * brand hue. Maps directly to the Recipely "Error States" design system:
 * - `danger`  — an action failed or content can't be shown (red)
 * - `warning` — a persistent condition the user should know about (amber)
 * - `success` — a confirmation (green); feedback surfaces aren't only for errors
 * - `neutral` — nothing is wrong, there's just nothing here yet (muted)
 */
export const SeverityType = {
  Danger: 'danger',
  Warning: 'warning',
  Success: 'success',
  Neutral: 'neutral',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type SeverityType = (typeof SeverityType)[keyof typeof SeverityType];
