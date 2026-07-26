import { UserProfileEntity, type UserProfileProps } from '@domain/user-profile/user-profile-entity';

const makeProps = (overrides: Partial<UserProfileProps> = {}): UserProfileProps => ({
  id: 'u-1',
  displayName: 'Ada Lovelace',
  bio: 'Home kitchen, small steps.',
  photoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
  recipeCount: 12,
  totalLikes: 3400,
  totalViews: 91000,
  joinedAt: new Date('2026-04-01T12:00:00.000Z'),
  ...overrides,
});

describe('UserProfileEntity.create', () => {
  it('exposes the bio through its getter when present', () => {
    const result = UserProfileEntity.create(makeProps({ bio: 'Weeknight cook.' }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.bio).toBe('Weeknight cook.');
  });

  it('preserves a null bio rather than coercing it to a string', () => {
    const result = UserProfileEntity.create(makeProps({ bio: null }));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.bio).toBeNull();
  });

  it('exposes the remaining public profile fields through getters', () => {
    const result = UserProfileEntity.create(makeProps());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.displayName).toBe('Ada Lovelace');
      expect(result.value.photoUrl).toBe('https://cdn.recipely.io/avatars/ada.webp');
      expect(result.value.recipeCount).toBe(12);
      expect(result.value.totalLikes).toBe(3400);
      expect(result.value.totalViews).toBe(91000);
      expect(result.value.joinedAt.toISOString()).toBe('2026-04-01T12:00:00.000Z');
    }
  });

  it('returns a ValidationFailure on the id field when id is blank', () => {
    const result = UserProfileEntity.create(makeProps({ id: '   ' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.code).toBe('validation');
      expect(result.failure.field).toBe('id');
    }
  });

  it('returns a ValidationFailure on the displayName field when displayName is empty', () => {
    const result = UserProfileEntity.create(makeProps({ displayName: '' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.code).toBe('validation');
      expect(result.failure.field).toBe('displayName');
    }
  });
});
