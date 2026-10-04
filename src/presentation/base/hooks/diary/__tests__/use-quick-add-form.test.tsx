import { act } from 'react-test-renderer';
import { MealSlot } from '@domain/diary/meal-slot';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useQuickAddForm } from '@presentation/base/hooks/diary/use-quick-add-form';
import type { QuickAddForm } from '@presentation/base/widgets/diary/add-food/state/quick-add-form';

const setup = () => {
  const form: { current: QuickAddForm | null } = { current: null };
  const Probe = (): null => {
    form.current = useQuickAddForm(MealSlot.Lunch);
    return null;
  };
  renderComponent(<Probe />);
  return (): QuickAddForm => {
    if (form.current === null) throw new Error('not rendered');
    return form.current;
  };
};

describe('useQuickAddForm', () => {
  it('has nothing to log until there is a name and more than zero kcal', () => {
    const get = setup();
    act(() => get().setName('Apple'));
    expect(get().food).toBeNull();
    act(() => get().setCalories('0'));
    expect(get().food).toBeNull();
    act(() => get().setCalories('95'));
    expect(get().food?.perServing.calories).toBe(95);
    expect(get().food?.isQuickAdd).toBe(true);
  });

  it('refuses a blank name and a serving past the entry caps', () => {
    const get = setup();
    act(() => get().setName('   '));
    act(() => get().setCalories('95'));
    expect(get().food).toBeNull();
    act(() => get().setName('Apple'));
    act(() => get().setCalories('999999'));
    expect(get().food).toBeNull();
  });

  it('adds up typed macros at 4 / 4 / 9, decimal commas included', () => {
    const get = setup();
    expect(get().macroCalories).toBeNull();
    act(() => get().setProtein('10'));
    act(() => get().setFat('1,5'));
    expect(get().macroCalories).toBeCloseTo(53.5);
  });
});
