import { useCallback } from 'react';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { TimerEntry } from '@application/timers/timer-entry';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { pauseTimer, resumeTimer, stopTimer } from '@presentation/base/timers/timer-controls';
import { rowAt } from '@presentation/base/hooks/assistant/args/row-at';
import { timerStore } from '@application/timers/timer-store';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';
import { ValueConstants } from '@core/constants';

/**
 * The timers, from wherever the user happens to be.
 *
 * @remarks
 * - **Because the bar is app-wide and the controls were not.** Pause and stop
 *   sit on the timers bar on every screen, but the actions were registered
 *   only by the recipe detail — so walking to the feed with something on the
 *   hob and saying "pause the timer" answered `unavailable_here` while the
 *   button for it was visible. That is the moment this whole feature exists
 *   for, and it is the moment it stopped working.
 * - **The subject exists, which is what admits it here.** A running timer is a
 *   real thing wherever the user is standing; nothing has to be invented to
 *   have something to act on.
 * - **One timer needs no name; several do.** With one running, "stop the
 *   timer" is unambiguous. With more, the argument picks by recipe name or by
 *   position, the same way the draft rows do — and with none, it says so
 *   rather than reporting a stop that stopped nothing.
 * - **The recipe screen still answers first.** Its handlers act on the recipe
 *   in front of the user, which is the better reading while it is open; the
 *   registry tries the innermost first and these sit below.
 */
export const useAssistantTimerActions = (): void => {
  const pick = useCallback((arg?: string): TimerEntry | null => {
    const running = Object.values(timerStore.getState().timers);
    if (running.length === ValueConstants.zero) return null;
    if (running.length === ValueConstants.one) return running[ValueConstants.zero] ?? null;

    const at = rowAt(
      running.map((timer) => timer.recipeName),
      arg,
    );
    return at === null ? null : (running[at] ?? null);
  }, []);

  useAssistantAction(
    AssistantAction.PauseTimer,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const timer = pick(arg);
        if (timer === null) return { ok: false, error: 'no_timer' };
        if (timer.isPaused) return { ok: true, title: timer.recipeName };

        await pauseTimer(timer.id);
        return { ok: true, title: timer.recipeName };
      },
      [pick],
    ),
  );

  useAssistantAction(
    AssistantAction.ResumeTimer,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const timer = pick(arg);
        if (timer === null) return { ok: false, error: 'no_timer' };

        await resumeTimer(timer.id);
        return { ok: true, title: timer.recipeName };
      },
      [pick],
    ),
  );

  useAssistantAction(
    AssistantAction.StopTimer,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const timer = pick(arg);
        if (timer === null) return { ok: false, error: 'no_timer' };

        await stopTimer(timer.id);
        return { ok: true, title: timer.recipeName };
      },
      [pick],
    ),
  );
};
