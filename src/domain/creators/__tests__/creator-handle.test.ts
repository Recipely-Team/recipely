import { ErrorMessageKey } from '@core/failure';
import { FailureField } from '@core/failure/diagnostic-message';
import { CreatorHandle } from '@domain/creators/creator-handle';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';

const { Instagram, TikTok } = CreatorPlatform;

const valueOf = (raw: string, platform: CreatorPlatformType = Instagram): string => {
  const result = CreatorHandle.create(raw, platform);
  if (!result.ok) throw new Error(`expected ${raw} to be valid`);
  return result.value.value;
};

const rejects = (raw: string, platform: CreatorPlatformType = Instagram): boolean => !CreatorHandle.create(raw, platform).ok;

describe('CreatorHandle', () => {
  describe('normalisation', () => {
    it('strips one leading @', () => {
      expect(valueOf('@chef.ada')).toBe('chef.ada');
    });

    it('lower-cases the handle', () => {
      expect(valueOf('Chef_ADA')).toBe('chef_ada');
    });

    it('trims surrounding whitespace before stripping the @', () => {
      expect(valueOf('  @Chef  ')).toBe('chef');
    });

    it('strips only one @, so a second one fails the charset', () => {
      expect(rejects('@@chef')).toBe(true);
    });

    it('does not strip an @ in the middle', () => {
      expect(rejects('chef@ada')).toBe(true);
    });
  });

  describe('charset', () => {
    it('accepts letters, digits, dots and underscores', () => {
      expect(valueOf('a.b_c9')).toBe('a.b_c9');
    });

    it.each(['chef-ada', 'chef ada', 'chef!', 'şef', 'chef#1'])('rejects %p', (raw) => {
      expect(rejects(raw)).toBe(true);
    });

    it('rejects an empty handle and a bare @', () => {
      expect(rejects('')).toBe(true);
      expect(rejects('@')).toBe(true);
    });
  });

  describe('per-platform length', () => {
    it('Instagram takes 1 to 30 characters', () => {
      expect(valueOf('a', Instagram)).toBe('a');
      expect(valueOf('a'.repeat(30), Instagram)).toHaveLength(30);
      expect(rejects('a'.repeat(31), Instagram)).toBe(true);
    });

    it('TikTok takes 2 to 24 characters', () => {
      expect(rejects('a', TikTok)).toBe(true);
      expect(valueOf('ab', TikTok)).toBe('ab');
      expect(valueOf('a'.repeat(24), TikTok)).toHaveLength(24);
      expect(rejects('a'.repeat(25), TikTok)).toBe(true);
    });

    it('counts the length after the @ is stripped', () => {
      expect(valueOf(`@${'a'.repeat(30)}`, Instagram)).toHaveLength(30);
    });
  });

  describe('dots', () => {
    it('rejects a leading dot', () => {
      expect(rejects('.chef')).toBe(true);
    });

    it('rejects a trailing dot', () => {
      expect(rejects('chef.')).toBe(true);
    });

    it('rejects two dots in a row', () => {
      expect(rejects('chef..ada')).toBe(true);
    });

    it('accepts dots that are separated', () => {
      expect(valueOf('chef.ada.cooks')).toBe('chef.ada.cooks');
    });
  });

  it('fails with the backend key and the handle field, so the copy matches a server refusal', () => {
    const result = CreatorHandle.create('bad handle', Instagram);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.messageKey).toBe(ErrorMessageKey.creatorHandleInvalid);
    expect(result.failure.field).toBe(FailureField.creatorHandle);
  });

  it('displays with an @ and compares by normalised value', () => {
    const a = CreatorHandle.create('@Chef', Instagram);
    const b = CreatorHandle.create('chef', Instagram);
    if (!a.ok || !b.ok) throw new Error('fixture');
    expect(a.value.display).toBe('@chef');
    expect(a.value.equals(b.value)).toBe(true);
  });
});
