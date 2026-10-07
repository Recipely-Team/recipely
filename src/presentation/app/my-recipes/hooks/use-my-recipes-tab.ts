import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import type { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { parseTabParam } from '@presentation/app/my-recipes/model/parse-tab-param';

/**
 * The active My Recipes tab, seeded and kept in step with `?tab=`.
 *
 * @remarks
 * - **A deep link picks the tab** — a publish lands on Created.
 * - **The param is re-read when it changes**, because this tab screen stays mounted.
 */
export const useMyRecipesTab = (): [TabType, (tab: TabType) => void] => {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TabType>(() => parseTabParam(params.tab));
  const lastTabParam = useRef(params.tab);
  useEffect(() => {
    if (params.tab === lastTabParam.current) return;
    lastTabParam.current = params.tab;
    if (params.tab !== undefined) setTab(parseTabParam(params.tab));
  }, [params.tab]);
  return [tab, setTab];
};
