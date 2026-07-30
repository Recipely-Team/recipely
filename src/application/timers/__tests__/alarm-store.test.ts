/**
 * Reported: "if two alarms go off at once I can only dismiss one". The store
 * held a single active alarm, so the second timer's trigger overwrote the
 * first — and the first stayed marked as already-alarmed, which kept it from
 * ever coming back. Its timer was left ringing with nothing on screen able to
 * stop it. Alarms queue now, and are dismissed one at a time.
 */

import { alarmStore } from '@application/timers/alarm-store';

const ringing = (): string[] => alarmStore.getState().alarms.map((alarm) => alarm.timerId);

describe('alarmStore', () => {
  beforeEach(() => {
    alarmStore.setState({ alarms: [] });
  });

  it('keeps both alarms when two timers finish together', () => {
    alarmStore.getState().trigger('r1:prep', 'Pasta');
    alarmStore.getState().trigger('r2:cook', 'Soup');

    expect(ringing()).toEqual(['r1:prep', 'r2:cook']);
  });

  it('hands the screen to the next alarm when the first is dismissed', () => {
    alarmStore.getState().trigger('r1:prep', 'Pasta');
    alarmStore.getState().trigger('r2:cook', 'Soup');

    alarmStore.getState().dismiss('r1:prep');

    expect(ringing()).toEqual(['r2:cook']);
  });

  it('is silent once every alarm has been dismissed', () => {
    alarmStore.getState().trigger('r1:prep', 'Pasta');
    alarmStore.getState().trigger('r2:cook', 'Soup');

    alarmStore.getState().dismiss('r2:cook');
    alarmStore.getState().dismiss('r1:prep');

    expect(ringing()).toEqual([]);
  });

  it('ignores a repeat trigger for a timer already ringing', () => {
    alarmStore.getState().trigger('r1:prep', 'Pasta');
    alarmStore.getState().trigger('r1:prep', 'Pasta');

    expect(ringing()).toEqual(['r1:prep']);
  });

  it('dismisses by id, not by position', () => {
    alarmStore.getState().trigger('r1:prep', 'Pasta');
    alarmStore.getState().trigger('r2:cook', 'Soup');

    // The notification action can dismiss the queued one first.
    alarmStore.getState().dismiss('r2:cook');

    expect(ringing()).toEqual(['r1:prep']);
  });

  it('shrugs off a dismiss for a timer that is not ringing', () => {
    alarmStore.getState().trigger('r1:prep', 'Pasta');

    alarmStore.getState().dismiss('ghost');

    expect(ringing()).toEqual(['r1:prep']);
  });
});
