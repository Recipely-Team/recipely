import { AssistantHeartbeat } from '@application/assistant/session/runtime/assistant-heartbeat';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { AssistantUsageReportType } from '@domain/assistant/session/assistant-usage-report';
import { UnknownFailure } from '@core/failure';

const TICK_MS = 15_000;

/** A token port whose usage reports answer with the queued budgets, one per tick. */
const tokensReporting = (reports: AssistantUsageReportType[]): AssistantTokenRepositoryInterface => ({
  mintSession: async () => ({ ok: false, failure: new UnknownFailure('unused') }),
  mintIntentToken: async () => ({ ok: false, failure: new UnknownFailure('unused') }),
  reportUsage: async () => {
    const next = reports.shift();
    return next === undefined ? { ok: false, failure: new UnknownFailure('no report') } : { ok: true, value: next };
  },
});

const listener = () => ({ onUsage: jest.fn(), onExhausted: jest.fn(), onNearlyOut: jest.fn() });

const tick = async (): Promise<void> => {
  jest.advanceTimersByTime(TICK_MS);
  await Promise.resolve();
  await Promise.resolve();
};

describe('AssistantHeartbeat', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reports each accepted usage report', async () => {
    const events = listener();
    const heartbeat = new AssistantHeartbeat(tokensReporting([{ remainingSeconds: 400, isUnlimited: false }]), events);

    heartbeat.start();
    await tick();

    expect(events.onUsage).toHaveBeenCalledWith({ remainingSeconds: 400, isUnlimited: false });
    expect(events.onExhausted).not.toHaveBeenCalled();
    heartbeat.stop();
  });

  it('warns once when about a minute is left, however many ticks stay under it', async () => {
    const events = listener();
    const low = { remainingSeconds: 60, isUnlimited: false };
    const heartbeat = new AssistantHeartbeat(tokensReporting([low, low, low]), events);

    heartbeat.start();
    await tick();
    await tick();
    await tick();

    expect(events.onNearlyOut).toHaveBeenCalledTimes(1);
    heartbeat.stop();
  });

  it('warns again in a new session', async () => {
    const events = listener();
    const low = { remainingSeconds: 60, isUnlimited: false };
    const heartbeat = new AssistantHeartbeat(tokensReporting([low, low]), events);

    heartbeat.start();
    await tick();
    heartbeat.start();
    await tick();

    expect(events.onNearlyOut).toHaveBeenCalledTimes(2);
    heartbeat.stop();
  });

  it('ends a metered session at zero, but never an unlimited one', async () => {
    const metered = listener();
    const unlimited = listener();
    const meteredBeat = new AssistantHeartbeat(tokensReporting([{ remainingSeconds: 0, isUnlimited: false }]), metered);
    const unlimitedBeat = new AssistantHeartbeat(tokensReporting([{ remainingSeconds: 0, isUnlimited: true }]), unlimited);

    meteredBeat.start();
    unlimitedBeat.start();
    await tick();

    expect(metered.onExhausted).toHaveBeenCalledTimes(1);
    expect(unlimited.onExhausted).not.toHaveBeenCalled();
    expect(unlimited.onNearlyOut).not.toHaveBeenCalled();
    meteredBeat.stop();
    unlimitedBeat.stop();
  });

  it('drops a report that lands after the session stopped', async () => {
    const events = listener();
    let answer: (value: { ok: true; value: AssistantUsageReportType }) => void = () => undefined;
    const tokens: AssistantTokenRepositoryInterface = {
      ...tokensReporting([]),
      reportUsage: () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    };
    const heartbeat = new AssistantHeartbeat(tokens, events);

    heartbeat.start();
    jest.advanceTimersByTime(TICK_MS);
    heartbeat.stop();
    answer({ ok: true, value: { remainingSeconds: 0, isUnlimited: false } });
    await Promise.resolve();
    await Promise.resolve();

    expect(events.onUsage).not.toHaveBeenCalled();
    expect(events.onExhausted).not.toHaveBeenCalled();
  });

  it('stops ticking after stop', async () => {
    const events = listener();
    const heartbeat = new AssistantHeartbeat(tokensReporting([{ remainingSeconds: 400, isUnlimited: false }]), events);

    heartbeat.start();
    heartbeat.stop();
    await tick();

    expect(events.onUsage).not.toHaveBeenCalled();
  });
});
