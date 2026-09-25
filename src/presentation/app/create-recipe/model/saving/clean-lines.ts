import { ValueConstants } from '@core/constants';

/** Trims every line and drops the empty ones. */
export const cleanLines = (lines: readonly string[]): string[] =>
  lines.map((s) => s.trim()).filter((s) => s.length > ValueConstants.zero);
