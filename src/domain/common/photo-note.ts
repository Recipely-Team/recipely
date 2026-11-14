import { ValueConstants } from '@core/constants';

/** The longest note a user may add to photos sent to the AI (specs/photo-note-rn-spec.md). */
export const PHOTO_NOTE_MAX_CHARS = 300;

/**
 * A typed note as a request carries it: trimmed, a blank note as `null`, and no
 * longer than the limit. The field already stops typing at the limit; this is
 * the same rule for text that arrives some other way (paste, the assistant).
 */
export const toPhotoNote = (raw: string): string | null => {
  const note = raw.trim();
  return note.length === ValueConstants.zero ? null : note.slice(ValueConstants.zero, PHOTO_NOTE_MAX_CHARS);
};
