import { act } from 'react-test-renderer';
import type { ApplicationStores } from '@application/di/application-stores';
import { StoreStatus } from '@application/store/store-status';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useSignedInUserId } from '@presentation/base/hooks/auth/use-signed-in-user-id';
import { useIsSignedIn } from '@presentation/base/hooks/auth/use-is-signed-in';
import { useSignedInUser } from '@presentation/base/hooks/auth/use-signed-in-user';

const userNamed = (displayName: string): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email');
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName });
  if (!user.ok) throw new Error('fixture user');
  return user.value;
};

const sessionFor = (user: UserEntity): AuthSessionEntity => {
  const session = AuthSessionEntity.create({ id: 's', accessToken: 'token', expiresAt: new Date('2030-01-01'), user });
  if (!session.ok) throw new Error('fixture session');
  return session.value;
};

// Regression: 15 components selected the whole auth `state`, so replacing the
// session (a profile edit, a creator-claim refresh) re-rendered every one of
// them, every feed row included, though the id and "signed in?" had not changed.
describe('signed-in selector hooks', () => {
  it('a profile edit does not re-render components that only need the id or "signed in?"', () => {
    const authStore = authStoreOf(userNamed('Old name'));
    const renders = { id: 0, signedIn: 0, user: 0 };
    const ById = (): null => { renders.id += 1; useSignedInUserId(); return null; };
    const BySignedIn = (): null => { renders.signedIn += 1; useIsSignedIn(); return null; };
    const ByUser = (): null => { renders.user += 1; useSignedInUser(); return null; };
    renderComponent(<><ById /><BySignedIn /><ByUser /></>, { authStore } as unknown as Partial<ApplicationStores>);
    const before = { ...renders };

    act(() => {
      authStore.setState({ state: { status: StoreStatus.Authenticated, session: sessionFor(userNamed('New name')) } });
    });

    expect(renders.id).toBe(before.id);
    expect(renders.signedIn).toBe(before.signedIn);
    expect(renders.user).toBe(before.user + 1);
  });

  it('answers for a guest', () => {
    const seen: unknown[] = [];
    const Probe = (): null => { seen.push(useSignedInUserId(), useIsSignedIn(), useSignedInUser()); return null; };
    renderComponent(<Probe />, { authStore: authStoreOf(null) } as unknown as Partial<ApplicationStores>);

    expect(seen.slice(-3)).toEqual([null, false, null]);
  });
});
