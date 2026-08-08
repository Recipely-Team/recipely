import { useCallback, useEffect, useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { IMPORT_STAGE_COUNT, importStageFor } from '@presentation/app/import-recipe/model/import-stage';
import { ValueConstants } from '@core/constants';
import { UnknownFailure, type Failure } from '@core/failure';
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

  // Queue once per arrival. A re-render must not re-submit the same reel.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    start();
  }, [start]);

  const job = state.status === StoreStatus.Loaded ? state.job : null;
  const isSettled =
    job !== null && (job.status === ImportJobStatus.Done || job.status === ImportJobStatus.Failed);

  useEffect(() => {
    if (job === null || isSettled) return;
    const poll = setInterval(() => void importJobStore.getState().refreshJob(), POLL_INTERVAL_MS);
    const tick = setInterval(() => setTicks((n) => n + ValueConstants.one), STAGE_TICK_MS);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [job, isSettled, importJobStore]);

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
    isQueueing: state.status === StoreStatus.Loading || state.status === StoreStatus.Idle,
    failure: state.status === StoreStatus.Error ? state.failure : jobFailure,
    jobStatus,
    activeStage,
    progress: activeStage / IMPORT_STAGE_COUNT,
    isDone,
    onRetry: start,
    onClose,
    onOpenDraft,
  };
};
