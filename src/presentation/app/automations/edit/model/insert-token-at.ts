import { CharConstants, ValueConstants } from "@core/constants";

/**
 * Inserts a message token (`{name}`, `{link}`) where the caret is, padding it
 * with a space before it unless whitespace is already there, and after it only
 * when a letter follows.
 *
 * @remarks
 * - **Returns the new text and the caret** just after the token, so the field
 *   keeps typing from there instead of jumping to the end.
 * - **A selection is replaced** by the token, as typing would.
 */
export const insertTokenAt = (
  text: string,
  selection: { start: number; end: number },
  token: string,
): { text: string; caret: number } => {
  const start = Math.max(
    ValueConstants.zero,
    Math.min(selection.start, text.length),
  );
  const end = Math.max(start, Math.min(selection.end, text.length));
  const before = text.slice(ValueConstants.zero, start);
  const after = text.slice(end);
  const lead =
    before.trimEnd().length === before.length &&
    before.length > ValueConstants.zero
      ? CharConstants.space
      : CharConstants.empty;
  const next = after.charAt(ValueConstants.zero);
  // Only a letter right after needs a gap; punctuation (`!`, `,`) sits tight.
  const trail =
    next.toLowerCase() !== next.toUpperCase()
      ? CharConstants.space
      : CharConstants.empty;
  const inserted = `${lead}${token}${trail}`;
  return {
    text: `${before}${inserted}${after}`,
    caret: before.length + lead.length + token.length,
  };
};
