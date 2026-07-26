import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';

const buildUser = (): UserEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error('test setup failed');
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U' });
  if (!user.ok) throw new Error('test setup failed');
  return user.value;
};

describe('AuthSessionEntity.isExpired', () => {
  it('is false when expiresAt is in the future', () => {
    const future = new Date(Date.now() + 60_000);
    const r = AuthSessionEntity.create({
      id: 's1',
      accessToken: 'tok',
      expiresAt: future,
      user: buildUser(),
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.isExpired()).toBe(false);
  });

  it('is true when expiresAt is in the past', () => {
    const past = new Date(Date.now() - 60_000);
    const r = AuthSessionEntity.create({
      id: 's1',
      accessToken: 'tok',
      expiresAt: past,
      user: buildUser(),
    });

    if (r.ok) expect(r.value.isExpired()).toBe(true);
  });

  it('treats exact equality as expired (clock-skew-safe)', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const r = AuthSessionEntity.create({
      id: 's1',
      accessToken: 'tok',
      expiresAt: now,
      user: buildUser(),
    });

    if (r.ok) expect(r.value.isExpired(now)).toBe(true);
  });
});

describe('AuthSessionEntity.create validation', () => {
  it('rejects empty accessToken', () => {
    const r = AuthSessionEntity.create({
      id: 's1',
      accessToken: '',
      expiresAt: new Date(),
      user: buildUser(),
    });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure.field).toBe('accessToken');
  });
});
