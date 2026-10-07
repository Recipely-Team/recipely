import { act, type ReactTestInstance } from 'react-test-renderer';
import { NetworkFailure, ValidationFailure } from '@core/failure';
import { MealSlot } from '@domain/diary/meal-slot';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import type { MealParseInputType } from '@domain/diary/meal/meal-parse-input';
import { mealCandidateOf } from '@domain/diary/__fixtures__/meal-candidate-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { MealLogBody } from '@presentation/base/widgets/diary/add-food/meal/meal-log-body';
import { MealLogPhase } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-phase';
import type { MealLog } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log';
import type { MealLogState } from '@presentation/base/widgets/diary/add-food/meal/state/meal-log-state';
import { t } from '@presentation/i18n';

/**
 * **What each phase of "log a meal" shows and which control it wires.** The state machine is
 * `useMealLog`'s (tested there); this pins that a phase reaches the right button — retry vs. edit
 * after a failure, start over on an empty result, add with the chosen meal.
 */
const RETRY_INPUT = { kind: MealParseInputKind.Text, text: 'toast', locale: 'en' } as unknown as MealParseInputType;

const logOf = (state: MealLogState, over: Partial<MealLog> = {}): MealLog => ({
  state,
  text: 'two eggs',
  setText: jest.fn(),
  photoDenied: false,
  parseText: jest.fn(),
  pickPhoto: jest.fn(),
  retry: jest.fn(),
  edit: jest.fn(),
  toggle: jest.fn(),
  setGrams: jest.fn(),
  selectedCount: 1,
  selectedCalories: 150,
  add: jest.fn().mockResolvedValue(undefined),
  ...over,
});

const render = (log: MealLog) => renderComponent(<MealLogBody log={log} meal={MealSlot.Lunch} isSubmitting={false} />).root;

const pressText = (root: ReactTestInstance, label: string): void => {
  const target = root.findAll((node) => typeof node.props.onPress === 'function' && textContent(node).includes(label)).at(-1);
  if (target === undefined) throw new Error(`no pressable with "${label}"`);
  act(() => (target.props.onPress as () => void)());
};

describe('MealLogBody', () => {
  it('says it is reading the meal while parsing', () => {
    expect(textContent(render(logOf({ phase: MealLogPhase.Parsing })))).toContain(t().diary.mealLogParsing);
  });

  it('offers Retry after a failure the user cannot fix by editing', () => {
    const log = logOf({ phase: MealLogPhase.Failed, failure: new NetworkFailure('offline'), retry: RETRY_INPUT });

    pressText(render(log), t().errors.retry);

    expect(log.retry).toHaveBeenCalledTimes(1);
    expect(log.edit).not.toHaveBeenCalled();
  });

  it('offers Edit after the description itself was rejected', () => {
    const log = logOf({ phase: MealLogPhase.Failed, failure: new ValidationFailure('too long', 'text'), retry: RETRY_INPUT });

    pressText(render(log), t().diary.mealLogEdit);

    expect(log.edit).toHaveBeenCalledTimes(1);
  });

  it('says nothing was found and lets the user start over', () => {
    const log = logOf({ phase: MealLogPhase.Review, rows: [], note: null });
    const root = render(log);

    expect(textContent(root)).toContain(t().diary.mealLogNothing);
    pressText(root, t().diary.mealLogStartOver);
    expect(log.edit).toHaveBeenCalledTimes(1);
  });

  it('lists the found foods, ticks one through its checkbox and adds to the meal it opened for', () => {
    const candidate = mealCandidateOf({ label: 'Boiled egg' });
    const log = logOf({ phase: MealLogPhase.Review, rows: [{ key: 'k1', candidate, included: true, gramsText: '100' }], note: null });
    const root = render(log);

    const checkbox = root.find((node) => node.props.accessibilityRole === 'checkbox' && typeof node.props.onPress === 'function');
    act(() => (checkbox.props.onPress as () => void)());
    act(() => (root.findByType(PrimaryButton).props.onPress as () => void)());

    expect(textContent(root)).toContain('Boiled egg');
    expect(log.toggle).toHaveBeenCalledWith('k1');
    expect(log.add).toHaveBeenCalledWith(MealSlot.Lunch);
  });

  it('will not add while nothing is ticked', () => {
    const log = logOf(
      { phase: MealLogPhase.Review, rows: [{ key: 'k1', candidate: mealCandidateOf(), included: false, gramsText: '100' }], note: null },
      { selectedCount: 0, selectedCalories: 0 },
    );

    expect(render(log).findByType(PrimaryButton).props.disabled).toBe(true);
  });
});
