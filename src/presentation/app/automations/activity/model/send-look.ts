import type { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';

/** How one send's status pill reads: its words, its colour role and its glyph. */
export interface SendLook {
  label: string;
  severity: SeverityType;
  icon: 'checkmark' | 'time-outline' | 'alert' | 'ellipsis-horizontal';
}
