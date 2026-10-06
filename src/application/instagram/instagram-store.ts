import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import type { InstagramStoreState } from '@application/instagram/instagram-store-state';
import type { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import type { StartInstagramLoginUseCase } from '@application/instagram/connect/start-instagram-login-use-case';
import type { FinalizeInstagramLinkUseCase } from '@application/instagram/connect/finalize-instagram-link-use-case';
import type { DisconnectInstagramUseCase } from '@application/instagram/connect/disconnect-instagram-use-case';
import { InstagramConnection } from '@domain/instagram/connect/instagram-connection';

interface InstagramStoreDeps {
  /** The `instagramAutomations` flag (admin override, else build value); off reports the feature unavailable. */
  isEnabled: () => Promise<boolean>;
  getConnection: GetInstagramConnectionUseCase;
  startLogin: StartInstagramLoginUseCase;
  finalize: FinalizeInstagramLinkUseCase;
  disconnect: DisconnectInstagramUseCase;
}

/**
 * The viewer's Instagram link (backend #374).
 *
 * @remarks
 * - **The newest answer wins.** Every load, finalize and disconnect bumps a
 *   generation; a read that started before one of them does not overwrite
 *   what it wrote.
 * - **A failed refresh keeps a loaded link** on screen; only a first load
 *   shows the error.
 * - **User-scoped**: cleared on sign-out.
 */
export const configureInstagramStore = (deps: InstagramStoreDeps): BoundStore<InstagramStoreState> => {
  let generation = ValueConstants.zero;

  return create<InstagramStoreState>((set, get) => {
    const load = async (): Promise<void> => {
      generation += ValueConstants.one;
      const requested = generation;
      const enabled = await deps.isEnabled();
      if (requested !== generation) return;
      // Flagged off: report the feature unavailable without asking the server, which hides every entry point.
      if (!enabled) return void set({ connection: { status: StoreStatus.Loaded, connection: InstagramConnection.none() } });
      if (get().connection.status !== StoreStatus.Loaded) set({ connection: { status: StoreStatus.Loading } });
      const result = await deps.getConnection.execute();
      if (requested !== generation) return;
      if (result.ok) set({ connection: { status: StoreStatus.Loaded, connection: result.value } });
      else if (get().connection.status !== StoreStatus.Loaded) set({ connection: { status: StoreStatus.Error, failure: result.failure } });
    };

    return {
      connection: { status: StoreStatus.Idle },
      load,
      startLogin: (returnTo) => deps.startLogin.execute(returnTo),
      finalize: async (code) => {
        generation += ValueConstants.one;
        const requested = generation;
        const result = await deps.finalize.execute(code);
        if (result.ok && requested === generation) set({ connection: { status: StoreStatus.Loaded, connection: result.value.connection } });
        return result;
      },
      disconnect: async () => {
        generation += ValueConstants.one;
        const result = await deps.disconnect.execute();
        if (result.ok) await load();
        return result;
      },
      clear: () => {
        generation += ValueConstants.one;
        set({ connection: { status: StoreStatus.Idle } });
      },
    };
  });
};
