import { ok } from '@core/result/result-helpers';
import type { BoundStore } from '@application/store/bound-store';
import type { InstagramStoreState } from '@application/instagram/instagram-store-state';
import { configureInstagramStore } from '@application/instagram/instagram-store';
import { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import { StartInstagramLoginUseCase } from '@application/instagram/connect/start-instagram-login-use-case';
import { FinalizeInstagramLinkUseCase } from '@application/instagram/connect/finalize-instagram-link-use-case';
import { DisconnectInstagramUseCase } from '@application/instagram/connect/disconnect-instagram-use-case';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';
import { connectionOf, fakeInstagramRepository } from '@application/instagram/__fixtures__/instagram-fixtures';

/**
 * A real Instagram store over a fake repository for component tests — by
 * default the feature is unavailable, which hides every Instagram surface and
 * leaves a screen exactly as it was before the feature.
 */
export const instagramStoreOf = (
  connection: InstagramConnection = connectionOf({ available: false, connected: false, status: null }),
): { store: BoundStore<InstagramStoreState>; repo: jest.Mocked<InstagramRepositoryInterface> } => {
  const repo = fakeInstagramRepository();
  repo.getConnection.mockResolvedValue(ok(connection));
  const store = configureInstagramStore({
    getConnection: new GetInstagramConnectionUseCase(repo),
    startLogin: new StartInstagramLoginUseCase(repo),
    finalize: new FinalizeInstagramLinkUseCase(repo),
    disconnect: new DisconnectInstagramUseCase(repo),
  });
  return { store, repo };
};
