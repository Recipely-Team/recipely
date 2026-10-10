import { useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { DiaryMode, type DiaryModeType } from '@presentation/app/diary/model/plan/diary-mode';

interface DiaryModeModel {
  mode: DiaryModeType;
  /** The `mealPlanner` flag: off, there is no switch and the tab is the Log. */
  canPlan: boolean;
  setMode: (mode: DiaryModeType) => void;
}

/**
 * Plan or Log on the Diary tab — the route's `mode` query, so a recipe
 * opened from the plan comes back to the plan, and a link can open either.
 * Until the flag answers (and whenever it is off) the tab shows the Log.
 */
export const useDiaryMode = (): DiaryModeModel => {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { mealPlanStore } = useStores();
  const canPlan = mealPlanStore((s) => s.enabled === true);

  useEffect(() => {
    void mealPlanStore.getState().checkEnabled();
  }, [mealPlanStore]);

  return {
    mode: canPlan && params.mode === DiaryMode.Plan ? DiaryMode.Plan : DiaryMode.Log,
    canPlan,
    setMode: useCallback((mode: DiaryModeType) => router.setParams({ mode }), [router]),
  };
};
