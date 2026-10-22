import type { UserEntity } from '@domain/auth/user-entity';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * The signed-in `UserEntity`, or `null` for a guest.
 *
 * @remarks
 * - For screens that show the user (name, photo, bio). It re-renders when the
 *   user changes, which is exactly when those screens must; a caller that only
 *   needs the id or "signed in?" uses `useSignedInUserId` / `useIsSignedIn`.
 */
export const useSignedInUser = (): UserEntity | null => {
  const { authStore } = useStores();
  return authStore((s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user : null));
};
