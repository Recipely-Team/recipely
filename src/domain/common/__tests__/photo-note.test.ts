import { PHOTO_NOTE_MAX_CHARS, toPhotoNote } from '@domain/common/photo-note';

describe('toPhotoNote', () => {
  it('sends a blank note as nothing', () => {
    expect(toPhotoNote('   \n ')).toBeNull();
  });

  it('trims and cuts a note at the limit', () => {
    expect(toPhotoNote('  only page two ')).toBe('only page two');
    expect(toPhotoNote('z'.repeat(PHOTO_NOTE_MAX_CHARS + 10))).toHaveLength(PHOTO_NOTE_MAX_CHARS);
  });
});
