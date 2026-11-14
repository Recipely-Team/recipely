import { CharConstants, ValueConstants } from '@core/constants';
import type { ScreenSnapshot } from '@application/assistant/screen/screen-snapshot';

/** Long enough for a full recipe page; a feed is cut rather than read for a minute. */
const MAX_TEXT_CHARS = 4000;
const CONTROL_SEPARATOR = ' | ';

/**
 * The snapshot as the model reads it: what the screen says, then what can be pressed.
 *
 * @remarks
 * - **Two labelled lines**, so the model can tell a heading from a button and
 *   press the button by the exact label it was given (`pressOnScreen`).
 * - **Capped**, at a sentence boundary of the list rather than mid-word.
 */
export const formatScreenSnapshot = (snapshot: ScreenSnapshot): string => {
  const lines: string[] = [];
  let used = ValueConstants.zero;
  const kept: string[] = [];
  for (const text of snapshot.texts) {
    if (used + text.length > MAX_TEXT_CHARS) {
      kept.push(CharConstants.ellipsis);
      break;
    }
    kept.push(text);
    used += text.length;
  }
  if (kept.length > ValueConstants.zero) lines.push(`On screen: ${kept.join(CharConstants.middotSpaced)}`);
  if (snapshot.controls.length > ValueConstants.zero) lines.push(`Buttons (pressOnScreen): ${snapshot.controls.join(CONTROL_SEPARATOR)}`);
  return lines.join(CharConstants.newline);
};
