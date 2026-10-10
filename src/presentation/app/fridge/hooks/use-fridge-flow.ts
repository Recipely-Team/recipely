import { useCallback, useReducer, useRef } from 'react';
import { ValueConstants } from '@core/constants';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLocale, t } from '@presentation/i18n';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import type { PickSource } from '@presentation/base/utils/pick-source';
import { useFridgePhotoPick } from '@presentation/app/fridge/hooks/use-fridge-photo-pick';
import { fridgeFlowReducer } from '@presentation/app/fridge/model/flow/fridge-flow-reducer';
import { initialFridgeFlow } from '@presentation/app/fridge/model/flow/initial-fridge-flow';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import type { FridgeChip } from '@presentation/app/fridge/model/flow/fridge-chip';
import type { FridgeFlowState } from '@presentation/app/fridge/model/flow/fridge-flow-state';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';
import { DEFAULT_FRIDGE_FILTERS } from '@presentation/app/fridge/model/filters/default-fridge-filters';
import { IdeasLoad } from '@presentation/app/fridge/model/ideas/ideas-load';
import type { FridgeIdeasQuery } from '@presentation/app/fridge/model/ideas/fridge-ideas-query';

/**
 * The fridge flow's view model: the reducer's state plus every intent the
 * screen dispatches — picking photos, the scan, chip edits, filters and ideas.
 *
 * @remarks
 * - **Page-scoped**, as the AI create flow keeps its prompt and phase: nothing
 *   here outlives the screen, so nothing needs clearing on sign-out.
 * - **Only the latest request lands.** Cancel, a retake or a second request
 *   bumps a ticket, and an answer carrying an older ticket is dropped.
 * - **A removed chip can come back**: the toast's Undo puts it where it was.
 * - **"Show 3 more" excludes every title shown**, so the server suggests new
 *   ones; a failed page is a toast and the shown ideas stay.
 */
export const useFridgeFlow = () => {
  const { fridgeStore } = useStores();
  const locale = useLocale();
  const pick = useFridgePhotoPick();
  const [state, dispatch] = useReducer(fridgeFlowReducer, undefined, initialFridgeFlow);
  const ticket = useRef(ValueConstants.zero);
  const latest = useRef<FridgeFlowState>(state);
  latest.current = state;

  const next = (): number => {
    ticket.current += ValueConstants.one;
    return ticket.current;
  };

  const addPhotos = useCallback(
    async (source: PickSource): Promise<void> => {
      const photos = await pick(source, FridgeLimits.photosMax - latest.current.photos.length);
      if (photos.length > ValueConstants.zero) dispatch({ type: 'photosAdded', photos });
    },
    [pick],
  );

  const findIngredients = useCallback(async (): Promise<void> => {
    const { photos } = latest.current;
    if (photos.length === ValueConstants.zero) return;
    const mine = next();
    dispatch({ type: 'scanStarted' });
    const result = await fridgeStore.getState().scan({ photos, locale });
    if (mine !== ticket.current) return;
    dispatch(result.ok ? { type: 'scanSucceeded', ingredients: result.value } : { type: 'scanFailed', failure: result.failure });
  }, [fridgeStore, locale]);

  const fetchIdeas = useCallback(
    async (query: FridgeIdeasQuery, exclude: readonly string[]): Promise<void> => {
      const mine = next();
      const { filters } = query;
      const result = await fridgeStore.getState().suggestIdeas({ ingredients: query.ingredients, maxMinutes: filters.maxMinutes, diet: filters.diet, servings: filters.servings, exclude, locale });
      if (mine !== ticket.current) return;
      if (result.ok) return dispatch({ type: 'ideasLoaded', ideas: result.value });
      if (exclude.length > ValueConstants.zero) showErrorToast(result.failure);
      dispatch({ type: 'ideasFailed', failure: result.failure });
    },
    [fridgeStore, locale],
  );

  const showIdeasWith = useCallback(
    (filters: FridgeFilters): void => {
      const query = { ingredients: latest.current.chips.map((chip) => chip.name), filters };
      if (query.ingredients.length === ValueConstants.zero) return;
      dispatch({ type: 'ideasStarted', query });
      void fetchIdeas(query, []);
    },
    [fetchIdeas],
  );

  const showMore = useCallback((): void => {
    const { view } = latest.current;
    if (view.step !== FridgeStep.Ideas || view.load !== IdeasLoad.Idle) return;
    dispatch({ type: 'moreStarted' });
    void fetchIdeas(view.query, view.ideas.map((idea) => idea.title));
  }, [fetchIdeas]);

  const removeChip = useCallback((chip: FridgeChip): void => {
    const index = latest.current.chips.findIndex((c) => c.key === chip.key);
    dispatch({ type: 'chipRemoved', key: chip.key });
    toastStore.getState().show({
      severity: SeverityType.Neutral,
      message: t().fridge.removed.replace('{x}', chip.name),
      actionLabel: t().fridge.undo,
      onAction: () => dispatch({ type: 'chipRestored', chip, index }),
    });
  }, []);

  return {
    state,
    addPhotos,
    removePhoto: (index: number) => dispatch({ type: 'photoRemoved', index }),
    findIngredients,
    cancelScan: () => {
      next();
      dispatch({ type: 'scanCancelled' });
    },
    retake: () => dispatch({ type: 'retake' }),
    typeInstead: () => dispatch({ type: 'typeInstead' }),
    removeChip,
    addChip: (name: string) => dispatch({ type: 'chipAdded', name }),
    changeFilters: (filters: Partial<FridgeFilters>) => dispatch({ type: 'filtersChanged', filters }),
    showIdeas: () => showIdeasWith(latest.current.filters),
    showMore,
    clearFiltersAndRetry: () => {
      dispatch({ type: 'filtersCleared' });
      showIdeasWith({ ...DEFAULT_FRIDGE_FILTERS, servings: latest.current.filters.servings });
    },
    markAdded: (title: string) => dispatch({ type: 'addedToList', title }),
    back: () => {
      next();
      dispatch({ type: 'back' });
    },
  };
};
