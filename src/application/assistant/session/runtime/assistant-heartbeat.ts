import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { AssistantUsageReportType } from '@domain/assistant/session/assistant-usage-report';
import { AssistantBudget } from '@domain/assistant/session/assistant-budget';
import { TimeConstants, ValueConstants } from '@core/constants';

interface AssistantHeartbeatListener {
  /** Every accepted report: the budget the server now holds. */
  onUsage(report: AssistantUsageReportType): void;
  /** A metered account reached zero; the session must end. */
  onExhausted(): void;
  /** About a minute is left; once per session. */
  onNearlyOut(): void;
}

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_SECONDS = 15;
/**
 * How much budget is left when the user is warned. One heartbeat of slack past
 * a round minute, so a tick cannot straddle the threshold and skip it — the
 * session used to end mid-sentence with only a caption to explain it.
 */
const BUDGET_WARNING_SECONDS = TimeConstants.secondsPerMinute + HEARTBEAT_SECONDS;

/**
 * Reports live voice seconds to the backend while a session runs.
 *
 * @remarks
 * - **Why a heartbeat.** The server is not part of the socket, so it cannot see
 *   the time spent; the app reports it in fixed slices.
 * - **Epochs.** A report still in flight when the session ended must not write
 *   onto the next one, so each `start` gets its own epoch and `stop` retires it.
 * - **One warning per session.** A second session warns again; a single one
 *   never warns twice.
 */
export class AssistantHeartbeat {
  private timer: ReturnType<typeof setInterval> | null = null;
  private epoch = ValueConstants.zero;

  constructor(
    private readonly tokens: AssistantTokenRepositoryInterface,
    private readonly listener: AssistantHeartbeatListener,
  ) {}

  start(): void {
    this.stop();
    const ownEpoch = this.epoch;
    let wasWarned = false;
    this.timer = setInterval(() => {
      void this.tokens.reportUsage(HEARTBEAT_SECONDS).then((reported) => {
        if (this.epoch !== ownEpoch || !reported.ok) return;
        this.listener.onUsage(reported.value);
        const budget = AssistantBudget.create(reported.value);
        if (!budget.ok) return;
        if (budget.value.isExhausted()) {
          this.listener.onExhausted();
          return;
        }
        if (!wasWarned && budget.value.needsWarning(BUDGET_WARNING_SECONDS)) {
          wasWarned = true;
          this.listener.onNearlyOut();
        }
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    this.epoch += ValueConstants.one;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
}
