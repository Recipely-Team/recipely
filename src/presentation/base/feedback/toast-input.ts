import type { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';

/** A toast as requested by a caller (id is assigned by the store). */
export interface ToastInput {
  severity: SeverityType;
  message: string;
  /** Optional trailing action (e.g. "Try again", "Undo"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Override the default visible duration; pass 0 to disable auto-dismiss. */
  durationMs?: number;
}
