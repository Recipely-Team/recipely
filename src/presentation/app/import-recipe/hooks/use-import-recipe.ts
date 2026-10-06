import { useCallback, useEffect, useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { importStageFor } from '@presentation/app/import-recipe/model/import-stage';
import { importStageKeysFor } from '@presentation/app/import-recipe/model/import-stage-keys';
import { ImportLink } from '@domain/recipes/import/import-link';
import { SourcePlatform, type SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import { CharConstants, ValueConstants } from '@core/constants';
import { UnknownFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { ensurePushRegistration } from '@application/notifications/ensure-push-registration';
import { t } from '@presentation/i18n';
import { ImportTrail } from '@presentation/base/errors/import-trail';

/** How often the screen asks the backend where the job has got to. */
const POLL_INTERVAL_MS = 4000;
/** How fast the checklist creeps forward through a long `running`. */
const STAGE_TICK_MS = 9000;

/** View model the import screen renders. */
interface UseImportRecipeResult {
  /** True while the enqueue request itself is in flight. */
  isQueueing: boolean;
  /** True when the screen is still asking for a link — the paste branch. */
  isAwaitingLink: boolean;
  /**
   * Why the import cannot continue, or null. Covers BOTH ends: the enqueue
   * request that never produced a job, and a job the worker gave up on — the
   * user is looking at one screen and needs one answer.
   */
  failure: Failure | null;
  /** The job's own status, or null before there is a job. */
  jobStatus: ImportJobStatus | null;
  /** 0..stageCount — how far the checklist has filled. */
  activeStage: number;
  /** How many stages the platform's checklist has: four for a video, three for a page. */
  stageCount: number;
  /** Where the link points; Instagram until a link is known. */
  platform: SourcePlatformType;
  /** The site as a person names it, for a web page's copy. */
  host: string;
  /** 0..1 for the ring. */
  progress: number;
  isDone: boolean;
  /** 1-based place in the queue, or null when the job is not waiting. */
  queuePosition: number | null;
  onRetry: () => void;
  /** Queues a link the user pasted. */
  onSubmitLink: (url: string) => void;
  onClose: () => void;
  /** Leaves the screen the way the button promises: with notifications on. */
  onNotifyMe: () => void;
  /** Opens the finished draft. No-op until the job reports one. */
  onOpenDraft: () => void;
  /**
   * The queue screen's one button: the draft once it is ready; before that,
   * "notify me" for a video and plain Cancel for a web page, which is read in
   * seconds and has no notification to promise.
   */
  onPrimary: () => void;
}

/**
 * Drives the import screen: queue the link, then say something true about it
 * until the user leaves.
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
  const goBackOrHome = useGoBackOrHome();
  const { importJobStore } = useStores();
  const state = importJobStore((s) => s.state);
  const [ticks, setTicks] = useState(ValueConstants.zero);
  // The link this screen is working on: the shared one, or the pasted one.
  const [pastedUrl, setPastedUrl] = useState<string | null>(null);
  const startedRef = useRef(false);
  const activeUrl = importUrl ?? pastedUrl;

  const startWith = useCallback(
    (url: string): void => {
      setTicks(ValueConstants.zero);
      void importJobStore.getState().startImport(url);
    },
    [importJobStore],
  );

  const start = useCallback((): void => {
    if (activeUrl === null || activeUrl === undefined) return;
    startWith(activeUrl);
  }, [activeUrl, startWith]);

  // Queue once per arrival, and only when the param is there.
  useEffect(() => {
    if (startedRef.current || importUrl === undefined) return;
    startedRef.current = true;
    startWith(importUrl);
  }, [startWith, importUrl]);

  const onSubmitLink = useCallback(
    (url: string): void => {
      setPastedUrl(url);
      startWith(url);
    },
    [startWith],
  );

  const job = state.status === StoreStatus.Loaded ? state.job : null;
  const isSettled =
    job !== null && (job.status === ImportJobStatus.Done || job.status === ImportJobStatus.Failed);

  // Keyed on id and status: each poll builds a fresh job object.
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

  // Back gesture / swipe also clears our copy of the receipt; the job runs on.
  useEffect(() => () => importJobStore.getState().clear(), [importJobStore]);

  const onClose = useCallback((): void => {
    // goBackOrHome: a cold-start share leaves this screen as the whole stack.
    importJobStore.getState().clear();
    goBackOrHome();
  }, [importJobStore, goBackOrHome]);

  // The copy promises a notification, so ask the OS for permission here.
  const onNotifyMe = useCallback((): void => {
    void getNotificationService()
      .requestPermissions()
      .then((granted) => {
        // Re-register push now that permission exists.
        if (granted) ensurePushRegistration();
        else showWarningToast(t().importRecipe.notifyBlocked);
      })
      .catch(() => showWarningToast(t().importRecipe.notifyBlocked))
      .finally(onClose);
  }, [onClose]);

  const onOpenDraft = useCallback((): void => {
    FailureReporter.trail(ImportTrail.openDraftTapped);
    const draftId = job?.draftId;
    importJobStore.getState().clear();

    // A done job without a draft id should not happen, but the button must still go somewhere.
    if (draftId === null || draftId === undefined) {
      FailureReporter.trail(ImportTrail.openDraftMissing);
      FailureReporter.report(
        new UnknownFailure(DiagnosticMessage.recipeImport.doneWithoutDraft),
        'ImportRecipe.openDraft',
      );
      router.replace({
        pathname: RoutePaths.myRecipes,
        params: { tab: RoutePaths.myRecipesDraftsTab },
      });
      return;
    }

    FailureReporter.trail(ImportTrail.navigatingToEditor);
    router.replace({ pathname: RoutePaths.createRecipe, params: { draftId } } as Href);
  }, [job, importJobStore, router]);

  // No URL means the paste screen (always on web).
  const isAwaitingLink =
    (activeUrl === null || activeUrl === undefined) && state.status === StoreStatus.Idle;

  const jobStatus = job?.status ?? null;
  const queuePosition = job?.queuePosition ?? null;
  // A failed job is shown through the same failure lookup as any error (errorKey rides on messageKey).
  const jobFailure =
    job !== null && job.status === ImportJobStatus.Failed
      ? new UnknownFailure(DiagnosticMessage.recipeImport.jobFailed, undefined, job.errorKey ?? undefined)
      : null;
  const link = activeUrl === null || activeUrl === undefined ? null : ImportLink.create(activeUrl);
  const platform = link !== null && link.ok ? link.value.platform : SourcePlatform.Instagram;
  const host = link !== null && link.ok ? link.value.host : CharConstants.empty;
  const stageCount = importStageKeysFor(platform).length;
  const activeStage = jobStatus === null ? ValueConstants.zero : importStageFor(jobStatus, ticks, stageCount);
  const isDone = jobStatus === ImportJobStatus.Done;
  const onPrimary = isDone ? onOpenDraft : platform === SourcePlatform.Web ? onClose : onNotifyMe;

  return {
    isQueueing: state.status === StoreStatus.Loading,
    isAwaitingLink,
    failure: state.status === StoreStatus.Error ? state.failure : jobFailure,
    jobStatus,
    activeStage,
    stageCount,
    platform,
    host,
    progress: activeStage / stageCount,
    isDone,
    queuePosition,
    onRetry: start,
    onSubmitLink,
    onClose,
    onNotifyMe,
    onOpenDraft,
    onPrimary,
  };
};
