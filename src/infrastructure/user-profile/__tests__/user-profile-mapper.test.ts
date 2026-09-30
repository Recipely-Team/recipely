import { toUserProfile } from '@infrastructure/user-profile/user-profile-mapper';
import type { UserProfileDto } from '@infrastructure/user-profile/user-profile-dto';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';

const fullDto: UserProfileDto = {
  id: 'u-1',
  displayName: 'Ada Lovelace',
  bio: 'Home kitchen, small steps.',
  photoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
  recipeCount: 12,
  totalLikes: 3400,
  totalViews: 91000,
  joinedAt: '2026-04-01T12:00:00.000Z',
};

describe('toUserProfile', () => {
  it('maps a UserProfileDto into a UserProfile entity', () => {
    const r = toUserProfile(fullDto);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBeInstanceOf(UserProfileEntity);
      expect(r.value.displayName).toBe('Ada Lovelace');
      expect(r.value.bio).toBe('Home kitchen, small steps.');
      expect(r.value.photoUrl).toBe('https://cdn.recipely.io/avatars/ada.webp');
      expect(r.value.recipeCount).toBe(12);
      expect(r.value.totalLikes).toBe(3400);
      expect(r.value.totalViews).toBe(91000);
    }
  });

  it('parses the wire joinedAt ISO string into a Date', () => {
    const r = toUserProfile(fullDto);

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.joinedAt).toBeInstanceOf(Date);
      expect(r.value.joinedAt.toISOString()).toBe('2026-04-01T12:00:00.000Z');
    }
  });

  it('passes through null bio and null photoUrl unchanged', () => {
    const r = toUserProfile({ ...fullDto, bio: null, photoUrl: null });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.bio).toBeNull();
      expect(r.value.photoUrl).toBeNull();
    }
  });

  it('rejects a DTO with an empty id', () => {
    const r = toUserProfile({ ...fullDto, id: '' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.field).toBe('id');
  });

  it('rejects a DTO with a blank displayName', () => {
    const r = toUserProfile({ ...fullDto, displayName: '   ' });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.field).toBe('displayName');
  });
});

describe('toUserProfile — creator tag', () => {
  it('maps an approved creator tag', () => {
    const r = toUserProfile({ ...fullDto, creator: { platform: 'tiktok', handle: 'ada.cooks' } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.creator?.platform).toBe('tiktok');
      expect(r.value.creator?.displayHandle).toBe('@ada.cooks');
      expect(r.value.isCreator).toBe(true);
    }
  });

  it('reads a null creator as no tag', () => {
    const r = toUserProfile({ ...fullDto, creator: null });
    expect(r.ok && r.value.creator).toBeNull();
  });

  it('reads a creator field missing from an older backend as no tag', () => {
    const r = toUserProfile(fullDto);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.creator).toBeNull();
      expect(r.value.isCreator).toBe(false);
    }
  });

  it('still opens the profile when the tag names an unknown platform', () => {
    const r = toUserProfile({ ...fullDto, creator: { platform: 'youtube', handle: 'ada' } });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.creator).toBeNull();
  });
});
