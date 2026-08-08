import { useCallback, useEffect, useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { IMPORT_STAGE_COUNT, importStageFor } from '@presentation/app/import-recipe/model/import-stage';
import { ValueConstants } from '@core/constants';
import { ErrorMessageKey, UnknownFailure, ValidationFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';

/** How often the screen asks the backend where the job has got to. */
const POLL_INTERVAL_MS = 4000;
/** How fast the checklist creeps forward through a long `running`. */
const STAGE_TICK_MS = 9000;

/** View model the import screen renders. */
interface UseImportRecipeResult {
  /** True while the enqueue request itself is in flight. */
  isQueueing: boolean;
  /**
   * Why the import cannot continue, or null. Covers BOTH ends: the enqueue
   * request that never produced a job, and a job the worker gave up on — the
   * user is looking at one screen and needs one answer.
   */
  failure: Failure | null;
  /** The job's own status, or null before there is a job. */
  jobStatus: ImportJobStatus | null;
  /** 0..IMPORT_STAGE_COUNT — how far the checklist has filled. */
  activeStage: number;
  /** 0..1 for the ring. */
  progress: number;
  isDone: boolean;
  /** False when there is nothing to retry WITH — no URL ever arrived. */
  canRetry: boolean;
  onRetry: () => void;
  onClose: () => void;
  /** Opens the finished draft. No-op until the job reports one. */
  onOpenDraft: () => void;
}

/**
 * Drives the Instagram import screen: queue the reel, then say something true
 * about it until the user leaves.
 *
 * @remarks
 * - **Leaving is not cancelling.** The job runs on a worker and its result
 *   arrives as a notification, so this hook only ever stops WATCHING. That is
 *   the promise the screen's copy makes, and the reason nothing here aborts.
 * - **The poll is the screen's, not the store's.** How often to ask is a
 *   question about a visible screen; the store owns what the answer means.
 * - **The checklist creeps, the ring does not.** Only the backend's four states
 *   are real, so the ring moves on them alone while the stage list walks
 *   forward on a timer — and stops short of the end until the job is done.
 */
export const useImportRecipe = (importUrl: string | undefined): UseImportRecipeResult => {
  const router = useRouter();
  const { importJobStore } = useStores();
  const state = importJobStore((s) => s.state);
  const [ticks, setTicks] = useState(ValueConstants.zero);
  const startedRef = useRef(false);

  const start = useCallback((): void => {
    if (importUrl === undefined) return;
    setTicks(ValueConstants.zero);
    void importJobStore.getState().startImport(importUrl);
  }, [importUrl, importJobStore]);

  // Queue once per arrival. A re-render must not re-submit the same reel — but
  // the guard is only spent on a call that can actually run: setting it for a
  // param that has not arrived yet left the screen queueing forever.
  useEffect(() => {
    if (startedRef.current || importUrl === undefined) return;
    startedRef.current = true;
    start();
  }, [start, importUrl]);

  const job = state.status === StoreStatus.Loaded ? state.job : null;
  const isSettled =
    job !== null && (job.status === ImportJobStatus.Done || job.status === ImportJobStatus.Failed);

  // WHY these are keyed on the job's ID and STATUS, not on `job` itself: every
  // successful poll builds a fresh `ImportJob` object even when nothing changed,
  // so an effect that depended on the object tore itself down every 4 s. The
  // 9 s stage tick never survived long enough to fire once — the checklist that
  // exists to prove the wait is alive sat frozen at zero for the whole import.
  const jobId = job?.id ?? null;
  const isWatchable = jobId !== null && !isSettled;

  useEffect(() => {
    if (!isWatchable) return;
    const poll = setInterval(() => void importJobStore.getState().refreshJob(), POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [isWatchable, jobId, importJobStore]);

  useEffect(() => {
    if (!isWatchable) return;
    const tick = setInterval(() => setTicks((n) => n + ValueConstants.one), STAGE_TICK_MS);
    return () => clearInterval(tick);
  }, [isWatchable, jobId]);

  // --- finding: leaving by gesture is still leaving ---
  // Android back and the iOS swipe unmount this screen without going through
  // `onClose`, and the receipt they left behind was rendered by the NEXT
  // import's first frame — including an "Open draft" button wired to the
  // previous reel. Dropping our copy is never cancelling; the job runs on.
  useEffect(() => () => importJobStore.getState().clear(), [importJobStore]);

  const onClose = useCallback((): void => {
    // The job outlives the screen; dropping our copy of the receipt is all that
    // leaving means.
    importJobStore.getState().clear();
    router.back();
  }, [importJobStore, router]);

  const onOpenDraft = useCallback((): void => {
    const draftId = job?.draftId;
    if (draftId === null || draftId === undefined) return;
    importJobStore.getState().clear();
    router.replace({ pathname: RoutePaths.createRecipe, params: { draftId } } as Href);
  }, [job, importJobStore, router]);

  // Arriving with no URL is not a spinner, it is a dead end: the screen has
  // nothing to queue and no way to get one. Say so instead of queueing forever.
  const missingUrl =
    importUrl === undefined
      ? new ValidationFailure(
          DiagnosticMessage.recipeImport.urlRequired,
          undefined,
          ErrorMessageKey.importInvalidUrl,
        )
      : null;

  const jobStatus = job?.status ?? null;
  // A job the worker failed is not a failed REQUEST, but it reaches the user as
  // the same thing: a stop with a reason. Wearing it as a `Failure` lets the
  // screen resolve its copy through the one lookup every other error uses —
  // `errorKey` rides on `messageKey`, the channel the backend already names.
  const jobFailure =
    job !== null && job.status === ImportJobStatus.Failed
      ? new UnknownFailure(DiagnosticMessage.recipeImport.jobFailed, undefined, job.errorKey ?? undefined)
      : null;
  const activeStage = jobStatus === null ? ValueConstants.zero : importStageFor(jobStatus, ticks);
  const isDone = jobStatus === ImportJobStatus.Done;

  return {
    isQueueing:
      missingUrl === null &&
      (state.status === StoreStatus.Loading || state.status === StoreStatus.Idle),
    failure: missingUrl ?? (state.status === StoreStatus.Error ? state.failure : jobFailure),
    jobStatus,
    activeStage,
    progress: activeStage / IMPORT_STAGE_COUNT,
    isDone,
    canRetry: missingUrl === null,
    onRetry: start,
    onClose,
    onOpenDraft,
  };
};
