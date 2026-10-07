import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { RequestEpoch } from '@application/store/request-epoch';
import type { InstagramStoreState } from '@application/instagram/instagram-store-state';
import type { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import type { StartInstagramLoginUseCase } from '@application/instagram/connect/start-instagram-login-use-case';
import type { FinalizeInstagramLinkUseCase } from '@application/instagram/connect/finalize-instagram-link-use-case';
import type { DisconnectInstagramUseCase } from '@application/instagram/connect/disconnect-instagram-use-case';

interface InstagramStoreDeps {
  /** Gated by the `instagramAutomations` flag: off, it answers "unavailable" without a server call. */
  getConnection: GetInstagramConnectionUseCase;
  startLogin: StartInstagramLoginUseCase;
  finalize: FinalizeInstagramLinkUseCase;
  disconnect: DisconnectInstagramUseCase;
}

/**
 * The viewer's Instagram link (backend #374).
 *
 * @remarks
 * - **The newest answer wins.** Every load, finalize and disconnect starts a
 *   new `RequestEpoch`; a read that started before one of them does not overwrite
 *   what it wrote.
 * - **A failed refresh keeps a loaded link** on screen; only a first load
 *   shows the error.
 * - **User-scoped**: cleared on sign-out.
 */
export const configureInstagramStore = (deps: InstagramStoreDeps): BoundStore<InstagramStoreState> => {
  const epoch = new RequestEpoch();

  return create<InstagramStoreState>((set, get) => {
    const load = async (): Promise<void> => {
      const isCurrent = epoch.start();
      if (get().connection.status !== StoreStatus.Loaded) set({ connection: { status: StoreStatus.Loading } });
      const result = await deps.getConnection.execute();
      if (!isCurrent()) return;
      if (result.ok) set({ connection: { status: StoreStatus.Loaded, connection: result.value } });
      else if (get().connection.status !== StoreStatus.Loaded) set({ connection: { status: StoreStatus.Error, failure: result.failure } });
    };

    return {
      connection: { status: StoreStatus.Idle },
      load,
      startLogin: (returnTo) => deps.startLogin.execute(returnTo),
      finalize: async (code) => {
        const isCurrent = epoch.start();
        const result = await deps.finalize.execute(code);
        if (result.ok && isCurrent()) set({ connection: { status: StoreStatus.Loaded, connection: result.value.connection } });
        return result;
      },
      disconnect: async () => {
        epoch.invalidate();
        const result = await deps.disconnect.execute();
        if (result.ok) await load();
        return result;
      },
      clear: () => {
        epoch.invalidate();
        set({ connection: { status: StoreStatus.Idle } });
      },
    };
  });
};
