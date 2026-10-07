import { act } from 'react-test-renderer';
import { fail, ok } from '@core/result/result-helpers';
import { ErrorMessageKey, NetworkFailure, RateLimitFailure, type Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { MealParseResult } from '@domain/diary/meal/meal-parse-result';
import { MealSlot } from '@domain/diary/meal-slot';
import type { MealCandidate } from '@domain/diary/meal/meal-candidate';
import { MealMatchKind } from '@domain/diary/meal/meal-match-kind';
import { MealParseNote } from '@domain/diary/meal/meal-parse-note';
import { mealCandidateOf } from '@domain/diary/__fixtures__/meal-candidate-of';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useMealLog } from '@presentation/base/hooks/diary/use-meal-log';
import { MealLogPhase } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-phase';
import type { MealLog } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log';

const menemen = mealCandidateOf();
const bread = mealCandidateOf({ label: 'Bread', grams: 50, portionGrams: 50, match: { kind: MealMatchKind.None, id: null, name: null }, estimated: true });

const parsedMeal: Result<MealParseResult, Failure> = ok({ items: [menemen, bread], note: MealParseNote.SomeEstimated });

const setup = (initialText: string | null = null, parsed: Result<MealParseResult, Failure> = parsedMeal) => {
  const parseMeal = { execute: jest.fn().mockResolvedValue(parsed) };
  const onLog = jest.fn(async (candidates: readonly MealCandidate[]) => candidates.map(() => true));
  const log: { current: MealLog | null } = { current: null };
  const Probe = (): null => {
    log.current = useMealLog({ initialText, onLog });
    return null;
  };
  renderComponent(<Probe />, { parseMeal } as unknown as Partial<ApplicationStores>);
  const get = (): MealLog => {
    if (log.current === null) throw new Error('not rendered');
    return log.current;
  };
  const rows = () => {
    const s = get().state;
    if (s.phase !== MealLogPhase.Review) throw new Error(`not reviewing: ${s.phase}`);
    return s.rows;
  };
  return { parseMeal, onLog, get, rows };
};

const parse = async (h: ReturnType<typeof setup>, text = 'menemen and bread') => {
  act(() => h.get().setText(text));
  await act(async () => h.get().parseText());
};

describe('useMealLog', () => {
  it('parses the description into a confirm list with every row ticked', async () => {
    const h = setup();
    await parse(h);
    expect(h.parseMeal.execute).toHaveBeenCalledWith(expect.objectContaining({ kind: 'text', text: 'menemen and bread' }));
    expect(h.rows().map((r) => [r.candidate.label, r.included, r.gramsText])).toEqual([['Menemen', true, '150'], ['Bread', true, '50']]);
    expect(h.get().selectedCount).toBe(2);
    expect(h.get().selectedCalories).toBe(400);
  });

  it('deselecting a row drops it from the count, the kcal and the add', async () => {
    const h = setup();
    await parse(h);
    act(() => h.get().toggle('1'));
    expect([h.get().selectedCount, h.get().selectedCalories]).toEqual([1, 200]);
    await act(async () => h.get().add(MealSlot.Lunch));
    expect(h.onLog).toHaveBeenCalledWith([menemen], MealSlot.Lunch);
    act(() => h.get().toggle('1'));
    expect(h.get().selectedCount).toBe(2);
  });

  it('editing grams rescales that row and logs the edited amount; a cleared box keeps the last amount', async () => {
    const h = setup();
    await parse(h);
    act(() => h.get().setGrams('0', '300'));
    expect(h.rows()[0]?.candidate.nutrients.calories).toBe(400);
    expect(h.get().selectedCalories).toBe(600);
    act(() => h.get().setGrams('0', ''));
    expect([h.rows()[0]?.gramsText, h.rows()[0]?.candidate.grams]).toEqual(['', 300]);
    await act(async () => h.get().add(MealSlot.Dinner));
    const [logged] = h.onLog.mock.calls[0] ?? [];
    expect(logged?.map((c) => c.grams)).toEqual([300, 50]);
  });

  it('keeps only the rows that failed to save after a partial add', async () => {
    const h = setup();
    await parse(h);
    h.onLog.mockResolvedValueOnce([true, false]);
    await act(async () => h.get().add(MealSlot.Lunch));
    expect(h.rows().map((r) => r.candidate.label)).toEqual(['Bread']);
  });

  it('shows the failure with the input to retry, and retry sends the same input again', async () => {
    const quota = new RateLimitFailure('quota', undefined, ErrorMessageKey.mealParseQuotaExceeded);
    const h = setup(null, fail(quota));
    await parse(h);
    expect(h.get().state).toMatchObject({ phase: MealLogPhase.Failed, failure: quota });
    h.parseMeal.execute.mockResolvedValueOnce(fail(new NetworkFailure('offline')));
    await act(async () => h.get().retry());
    expect(h.parseMeal.execute).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'menemen and bread' }));
    act(() => h.get().edit());
    expect([h.get().state.phase, h.get().text]).toEqual([MealLogPhase.Compose, 'menemen and bread']);
  });

  it('reads an assistant description at once', async () => {
    const h = setup('menemen');
    await act(async () => undefined);
    expect(h.parseMeal.execute).toHaveBeenCalledWith(expect.objectContaining({ kind: 'text', text: 'menemen' }));
    expect(h.rows()).toHaveLength(2);
  });
});
