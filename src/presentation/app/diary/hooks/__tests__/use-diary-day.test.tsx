/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
/** The latest focus callback; tests call it to simulate the tab gaining focus again. */
const mockFocus: { run: () => void } = { run: () => undefined };
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocus.run = callback;
    // Required here: a jest.mock factory may not close over module imports.
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(callback, [callback]);
  },
}));
jest.mock('@presentation/base/feedback/show-toast', () => ({ showErrorToast: jest.fn() }));
jest.mock('@presentation/base/errors/use-report-failure', () => ({ useReportFailure: jest.fn() }));

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { NetworkFailure, type Failure } from '@core/failure';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { DiaryDay } from '@domain/diary/day/diary-day';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { StoresType } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { useDiaryDay } from '@presentation/app/diary/hooks/use-diary-day';

const sep29 = CalendarDate.of(2026, 9, 29);
const sep30 = CalendarDate.of(2026, 9, 30);

interface FakeState {
  selectedDate: CalendarDate;
  days: Record<string, DiaryDay>;
  errors: { day: Failure | null };
  loadDay: jest.Mock;
  selectDate: jest.Mock;
  clearError: jest.Mock;
}

const setup = (selected: CalendarDate) => {
  const diaryStore = create<FakeState>((set) => ({
    selectedDate: selected,
    days: { [selected.value]: DiaryDay.empty(selected, NutritionGoals.defaults()) },
    errors: { day: null },
    loadDay: jest.fn().mockResolvedValue(undefined),
    selectDate: jest.fn(async (date: CalendarDate) => set({ selectedDate: date })),
    clearError: jest.fn(() => set({ errors: { day: null } })),
  }));
  const Probe = (): null => {
    useDiaryDay();
    return null;
  };
  const mount = () => renderComponent(<Probe />, { diaryStore } as unknown as Partial<StoresType>);
  return { diaryStore, mount };
};

describe('useDiaryDay', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.useRealTimers());

  it('moves a screen left on today to the new today when it is focused after midnight', () => {
    jest.useFakeTimers({ now: new Date(2026, 8, 29, 23, 50) });
    const { diaryStore, mount } = setup(sep29);
    mount();
    expect(diaryStore.getState().selectDate).not.toHaveBeenCalled();

    jest.setSystemTime(new Date(2026, 8, 30, 0, 10));
    act(() => mockFocus.run());
    expect(diaryStore.getState().selectDate).toHaveBeenCalledWith(sep30);
  });

  it('leaves a past day the user chose where it is across midnight', () => {
    jest.useFakeTimers({ now: new Date(2026, 8, 30, 10) });
    const { diaryStore, mount } = setup(CalendarDate.of(2026, 9, 20));
    mount();
    expect(diaryStore.getState().selectDate).not.toHaveBeenCalled();
    expect(diaryStore.getState().loadDay).toHaveBeenCalled();
  });

  it('toasts a failed refresh over a cached day, once', () => {
    const { diaryStore, mount } = setup(sep30);
    mount();
    const failure = new NetworkFailure('offline');
    act(() => diaryStore.setState({ errors: { day: failure } }));
    expect(showErrorToast).toHaveBeenCalledWith(failure);
    expect(diaryStore.getState().clearError).toHaveBeenCalled();
  });
});
