import { useEffect, useEffectEvent } from 'react';
import { useRouter } from 'expo-router';
import { FailureCode } from '@core/failure/failure-code';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTranslations } from '@presentation/i18n';
import { showDangerToast, showErrorToast } from '@presentation/base/feedback/show-toast';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { ImportTrail } from '@presentation/base/errors/import-trail';
import { RoutePaths } from '@presentation/base/constants';

/** What the editor does with the outcome of opening `?draftId=`. */
interface DraftResumeHandlers {
  onResumed: (draft: RecipeDraft) => void;
  /** The draft could not be read; the editor falls back to the prompt. */
  onUnreadable: () => void;
}

/**
 * Opens the draft named by `?draftId=` in the editor.
 *
 * @remarks
 * - **A dead pointer is its own answer.** Publishing a draft DELETES it, while
 *   the import job and its completion notification go on naming that id for
 *   good — so `?draftId=` routinely points at a draft that no longer exists.
 *   Treating that 404 like any other read failure dropped the user on a blank
 *   AI prompt, which says "your draft failed to open" about a draft they had
 *   already turned into a recipe. Nothing here can be retried, so it says so
 *   and leaves them among the drafts that DO exist.
 * - **Any other failure is reported and the param dropped**, or autosave would
 *   target the draft that failed to load.
 * - **Each step leaves a crash-report breadcrumb** (`ImportTrail`): imports
 *   arrive here, and a failure in between is otherwise invisible.
 */
export const useDraftResume = (draftId: string | undefined, handlers: DraftResumeHandlers): void => {
  const t = useTranslations();
  const router = useRouter();
  const { draftsStore } = useStores();
  const resumed = useEffectEvent(handlers.onResumed);
  const unreadable = useEffectEvent(handlers.onUnreadable);
  const draftGone = useEffectEvent(() => {
    showDangerToast(t.createRecipe.draftGone);
    router.replace({ pathname: RoutePaths.myRecipes, params: { tab: RoutePaths.myRecipesDraftsTab } });
  });
  const dropParam = useEffectEvent(() => router.replace(RoutePaths.createRecipe));

  useEffect(() => {
    if (draftId === undefined) return;
    // An object, not a let: the cleanup flips it after the await, which a narrowed let cannot show.
    const run = { isCancelled: false };
    FailureReporter.trail(ImportTrail.editorMounted);
    FailureReporter.trail(ImportTrail.draftFetchStarted);
    void draftsStore
      .getState()
      .getDraft(draftId)
      .then((result) => {
        if (run.isCancelled) return;
        if (result.ok) {
          FailureReporter.trail(ImportTrail.draftFetchOk);
          resumed(result.value);
          FailureReporter.trail(ImportTrail.editorReady);
          return;
        }
        FailureReporter.trail(ImportTrail.draftFetchFailed);
        if (result.failure.code === FailureCode.NotFound) {
          draftGone();
          return;
        }
        showErrorToast(result.failure);
        FailureReporter.report(result.failure, 'CreateRecipe.resumeDraft');
        dropParam();
        unreadable();
      });
    return () => {
      run.isCancelled = true;
    };
  }, [draftId, draftsStore]);
};
