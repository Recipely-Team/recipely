/**
 * THE REGRESSION: the import checklist sat frozen at zero for the whole import.
 *
 * The screen runs two timers — a 4 s poll and a 9 s stage tick — and both lived
 * in ONE effect keyed on the job object. Every successful poll stores a freshly
 * built `ImportJob` (the mapper makes a new object even when nothing changed),
 * so the object's identity changed every 4 s, the effect tore itself down, and
 * the 9 s tick was destroyed before it ever fired. The checklist that exists to
 * prove the wait is alive never moved — and it only moved at all when polling
 * FAILED, because a failed poll writes nothing.
 *
 * So the fixture below deliberately returns a NEW object from every poll: that
 * churn is the bug's whole mechanism, and a fixture that returned the same
 * reference would pass against the broken code.
 */

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useImportRecipe } from '@presentation/app/import-recipe/hooks/use-import-recipe';
import type { ImportJobStoreState } from '@application/recipes/import/import-job-store-state';
import { ImportJobStatus } from '@domain/recipes/import/import-job-status';
import { IMPORT_STAGE_COUNT } from '@presentation/app/import-recipe/model/import-stage';
import { RoutePaths } from '@presentation/base/constants';

const mockRouter = { replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => mockRouter),
}));

const REEL = 'https://www.instagram.com/reel/abc/';
const POLL_MS = 4000;
const TICK_MS = 9000;

/** A store whose `refreshJob` behaves like the real one: a new object each time. */
const makeStores = (status: ImportJobStatus, positions: readonly (number | null)[] = [null]) => {
  let polls = 0;
  // The queue moves under a waiting job, so each poll may answer differently.
  const positionAt = (n: number): number | null => positions[Math.min(n, positions.length - 1)] ?? null;
  const importJobStore = create<ImportJobStoreState>((set) => ({
    state: { status: 'idle' },
    startImport: async () => {
      set({ state: { status: 'loaded', job: { id: 'job-1', status, draftId: null, errorKey: null, queuePosition: positionAt(0) } } });
      await Promise.resolve();
    },
    refreshJob: async () => {
      polls += 1;
      // A FRESH object, exactly as `toImportJob` produces on every response.
      set({ state: { status: 'loaded', job: { id: 'job-1', status, draftId: null, errorKey: null, queuePosition: positionAt(polls) } } });
      await Promise.resolve();
    },
    clear: () => set({ state: { status: 'idle' } }),
  }));

  return { stores: { importJobStore } as unknown as Stores, pollCount: () => polls };
};

type ViewModel = ReturnType<typeof useImportRecipe>;

const drive = (status: ImportJobStatus, positions?: readonly (number | null)[]) => {
  const { stores, pollCount } = makeStores(status, positions);
  let latest!: ViewModel;

  const Probe = (): null => {
    latest = useImportRecipe(REEL);
    return null;
  };

  renderComponent(
    <StoresProvider value={stores}>
      <Probe />
    </StoresProvider>,
  );

  return { latest: () => latest, pollCount };
};

/** Advances time in poll-sized slices so the polls genuinely interleave. */
const advance = async (ms: number): Promise<void> => {
  const slices = Math.ceil(ms / POLL_MS);
  for (let i = 0; i < slices; i += 1) {
    await act(async () => {
      jest.advanceTimersByTime(POLL_MS);
      await Promise.resolve();
    });
  }
};

describe('useImportRecipe — the wait has to keep moving', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('advances the checklist while the job runs, even though every poll rewrites the job', async () => {
    const { latest } = drive(ImportJobStatus.Running);
    await act(async () => {
      await Promise.resolve();
    });
    expect(latest().activeStage).toBe(0);

    await advance(TICK_MS + POLL_MS);

    // Against the unfixed code this is still 0: the tick never survived a poll.
    expect(latest().activeStage).toBeGreaterThan(0);
  });

  it('keeps polling while the job runs', async () => {
    const { pollCount } = drive(ImportJobStatus.Running);
    await act(async () => {
      await Promise.resolve();
    });

    await advance(POLL_MS * 3);

    expect(pollCount()).toBeGreaterThanOrEqual(2);
  });

  it('stops polling once the job is done, and fills every stage', async () => {
    const { latest, pollCount } = drive(ImportJobStatus.Done);
    await act(async () => {
      await Promise.resolve();
    });

    await advance(POLL_MS * 3);

    expect(pollCount()).toBe(0);
    expect(latest().isDone).toBe(true);
    expect(latest().activeStage).toBe(IMPORT_STAGE_COUNT);
  });
});

describe('useImportRecipe — leaving', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRouter.back.mockClear();
    mockRouter.replace.mockClear();
    mockRouter.canGoBack.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * THE REGRESSION: "app kapandı". A share intent on a cold start makes this
   * screen the entire navigation stack, and `router.back()` on the only screen
   * closes the app on Android — so "Got it, notify me" quit Recipely.
   */
  it('goes home rather than out of the app when there is nothing to go back to', async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    const { latest } = drive(ImportJobStatus.Queued);
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      latest().onClose();
    });

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith(RoutePaths.recipes);
  });

  it('goes back normally when a screen is behind it', async () => {
    const { latest } = drive(ImportJobStatus.Queued);
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      latest().onClose();
    });

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});

describe('useImportRecipe — arriving with no URL', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for a link instead of queueing forever', async () => {
    const { stores } = makeStores(ImportJobStatus.Queued);
    let latest!: ViewModel;
    const Probe = (): null => {
      // A deep link or a restored route can land here with no param at all.
      latest = useImportRecipe(undefined);
      return null;
    };

    renderComponent(
      <StoresProvider value={stores}>
        <Probe />
      </StoresProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    // The first cut left `isQueueing` true forever behind a spinning button with
    // nothing behind it. Now no URL simply means "we have not been given one" —
    // which is every web visit, where there is no share sheet to arrive from.
    expect(latest.isAwaitingLink).toBe(true);
    expect(latest.failure).toBeNull();
    expect(latest.isQueueing).toBe(false);
  });
});

describe('useImportRecipe — where in the queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('surfaces the position the backend reported', async () => {
    const { latest } = drive(ImportJobStatus.Queued, [4]);

    await act(async () => {
      await Promise.resolve();
    });

    expect(latest().queuePosition).toBe(4);
  });

  it('follows the queue forward as jobs ahead finish', async () => {
    // The number is only worth showing if it MOVES. A position frozen at 4
    // through a two-minute wait reads as a queue that has stopped.
    const { latest } = drive(ImportJobStatus.Queued, [4, 3, 2, 1]);

    await act(async () => {
      await Promise.resolve();
    });
    expect(latest().queuePosition).toBe(4);

    await advance(POLL_MS * 3);

    expect(latest().queuePosition).toBe(1);
  });

  it('reports nothing when the backend sends no position', async () => {
    // An older backend, or a job that has started. Either way the screen shows
    // no badge rather than inventing a place in a line.
    const { latest } = drive(ImportJobStatus.Queued, [null]);

    await act(async () => {
      await Promise.resolve();
    });

    expect(latest().queuePosition).toBeNull();
  });
});
