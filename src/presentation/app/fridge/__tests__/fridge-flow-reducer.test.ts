import { ErrorMessageKey, NetworkFailure, RateLimitFailure, ServerFailure } from '@core/failure';
import { FridgeConfidence } from '@domain/fridge/scan/fridge-confidence';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { fridgeFlowReducer } from '@presentation/app/fridge/model/flow/fridge-flow-reducer';
import { initialFridgeFlow } from '@presentation/app/fridge/model/flow/initial-fridge-flow';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import { IdeasLoad } from '@presentation/app/fridge/model/ideas/ideas-load';
import { DEFAULT_FRIDGE_FILTERS } from '@presentation/app/fridge/model/filters/default-fridge-filters';
import type { FridgeFlowState } from '@presentation/app/fridge/model/flow/fridge-flow-state';
import type { FridgeFlowActionType } from '@presentation/app/fridge/model/flow/fridge-flow-action';

const photo = (n: number) => ({ uri: `file:///p${n}.jpg`, fileName: `p${n}.jpg`, mimeType: 'image/jpeg' });
const idea = (title: string): FridgeIdea => ({ title, summary: 's', totalMinutes: 20, difficulty: 'EASY', uses: ['egg'], missing: [] }) as unknown as FridgeIdea;
const run = (...actions: FridgeFlowActionType[]): FridgeFlowState => actions.reduce(fridgeFlowReducer, initialFridgeFlow());

const scanned: FridgeFlowActionType[] = [
  { type: 'photosAdded', photos: [photo(1)] },
  { type: 'scanStarted' },
  { type: 'scanSucceeded', ingredients: [{ name: 'egg', confidence: FridgeConfidence.High }, { name: 'leek', confidence: FridgeConfidence.Low }] },
];

describe('fridgeFlowReducer', () => {
  it('keeps at most three photos', () => {
    const state = run({ type: 'photosAdded', photos: [photo(1), photo(2)] }, { type: 'photosAdded', photos: [photo(3), photo(4)] });
    expect(state.photos).toHaveLength(3);
  });

  it('turns a scan into chips, faded where the model was not sure', () => {
    const state = run(...scanned);
    expect(state.view.step).toBe(FridgeStep.Ingredients);
    expect(state.chips.map((chip) => [chip.name, chip.sure])).toEqual([
      ['egg', true],
      ['leek', false],
    ]);
  });

  it('opens the limit state on the daily quota, and nothing-found on an empty scan', () => {
    const quota = new RateLimitFailure('quota', undefined, ErrorMessageKey.fridgeQuotaExceeded);
    expect(run({ type: 'photosAdded', photos: [photo(1)] }, { type: 'scanStarted' }, { type: 'scanFailed', failure: quota }).view.step).toBe(FridgeStep.Limit);
    expect(run({ type: 'photosAdded', photos: [photo(1)] }, { type: 'scanStarted' }, { type: 'scanSucceeded', ingredients: [] }).view.step).toBe(FridgeStep.NothingFound);
  });

  it('goes back to capture with a banner on any other failure, keeping the photos', () => {
    const state = run({ type: 'photosAdded', photos: [photo(1)] }, { type: 'scanStarted' }, { type: 'scanFailed', failure: new NetworkFailure() });
    expect(state.view).toEqual({ step: FridgeStep.Capture, failure: expect.any(NetworkFailure) });
    expect(state.photos).toHaveLength(1);
  });

  it('ignores a scan answer that lands after Cancel', () => {
    const state = run({ type: 'photosAdded', photos: [photo(1)] }, { type: 'scanStarted' }, { type: 'scanCancelled' }, scanned[2]!);
    expect(state.view.step).toBe(FridgeStep.Capture);
  });

  it('does not add a typed chip twice', () => {
    const state = run(...scanned, { type: 'chipAdded', name: 'Egg' });
    expect(state.chips).toHaveLength(2);
  });

  it('puts an undone chip back where it was', () => {
    const before = run(...scanned);
    const egg = before.chips[0]!;
    const state = [{ type: 'chipRemoved', key: egg.key } as const, { type: 'chipRestored', chip: egg, index: 0 } as const].reduce(fridgeFlowReducer, before);
    expect(state.chips.map((chip) => chip.name)).toEqual(['egg', 'leek']);
  });

  it('appends only new ideas, and calls the list exhausted when none came', () => {
    const query = { ingredients: ['egg'], filters: DEFAULT_FRIDGE_FILTERS };
    const first = run(...scanned, { type: 'ideasStarted', query }, { type: 'ideasLoaded', ideas: [idea('Menemen'), idea('Omlet')] });
    const more = [{ type: 'moreStarted' } as const, { type: 'ideasLoaded', ideas: [idea('menemen')] } as const].reduce(fridgeFlowReducer, first);
    if (more.view.step !== FridgeStep.Ideas) throw new Error('not on ideas');
    expect(more.view.ideas).toHaveLength(2);
    expect(more.view.load).toBe(IdeasLoad.Exhausted);
  });

  it('returns to the ingredients with a banner when the first ideas fail', () => {
    const query = { ingredients: ['egg'], filters: DEFAULT_FRIDGE_FILTERS };
    const state = run(...scanned, { type: 'ideasStarted', query }, { type: 'ideasFailed', failure: new ServerFailure() });
    expect(state.view).toEqual({ step: FridgeStep.Ingredients, failure: expect.any(ServerFailure), startAdding: false });
  });
});
