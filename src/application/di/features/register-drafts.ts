import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';
import { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { configureDraftsStore } from '@application/drafts/drafts-store';

/** **Drafts composition** — the recipe-draft store and its use cases. */
export const registerDrafts = (container: Container): Pick<ApplicationStores, 'draftsStore'> => {
  const draftRepo = container.resolve<RecipeDraftRepositoryInterface>(TOKENS.RecipeDraftRepository);
  const listDraftsUseCase = new ListDraftsUseCase(draftRepo);
  const getLatestDraftUseCase = new GetLatestDraftUseCase(draftRepo);
  const getDraftUseCase = new GetDraftUseCase(draftRepo);
  const upsertDraftUseCase = new UpsertDraftUseCase(draftRepo);
  const deleteDraftUseCase = new DeleteDraftUseCase(draftRepo);
  const draftsStore = configureDraftsStore({
    listDraftsUseCase,
    getLatestDraftUseCase,
    getDraftUseCase,
    upsertDraftUseCase,
    deleteDraftUseCase,
  });
  return { draftsStore };
};
