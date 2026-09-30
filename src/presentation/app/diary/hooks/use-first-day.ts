import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { DiaryDay } from '@domain/diary/day/diary-day';
import { ValueConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Whether to show the first-day welcome card (design spec → Food Diary §8):
 * the user has never logged anything. "Recent foods" is the account-wide
 * answer to that, so it is (re)loaded on focus and the card only appears once
 * it has come back empty — never while it is still on its way.
 */
export const useFirstDay = (day: DiaryDay | null): boolean => {
  const { diaryStore } = useStores();
  const recentCount = diaryStore((s) => s.recent.length);
  const recentFailed = diaryStore((s) => s.errors.recent !== null);
  const [checked, setChecked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void diaryStore
        .getState()
        .loadRecent()
        .then(() => setChecked(true));
    }, [diaryStore]),
  );

  return checked && !recentFailed && recentCount === ValueConstants.zero && day !== null && !day.hasEntries;
};
