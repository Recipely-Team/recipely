import { useState } from 'react';
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useStepNavigation } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-step-navigation';
import type { StepNavigation } from '@presentation/app/recipes/[recipeId]/cook/model/step-navigation';

const probe = (count: number): { current: () => StepNavigation; rerender: (next: number) => void } => {
  let latest!: StepNavigation;
  let setCount!: (next: number) => void;
  const Probe = (): null => {
    const [n, set] = useState(count);
    setCount = set;
    latest = useStepNavigation(n);
    return null;
  };
  renderComponent(<Probe />);
  return {
    current: () => latest,
    rerender: (next) => act(() => setCount(next)),
  };
};

describe('useStepNavigation — cook mode never shows a step that does not exist', () => {
  it('starts on the first step and walks forward to the last', () => {
    const nav = probe(3);
    expect(nav.current()).toMatchObject({ index: 0, isFirst: true, isLast: false });
    act(() => void nav.current().next());
    act(() => void nav.current().next());
    expect(nav.current()).toMatchObject({ index: 2, isLast: true });
  });

  it('stays on the last step on "next" and on the first on "previous", and says it did not move', () => {
    const nav = probe(2);
    let moved = true;
    act(() => {
      moved = nav.current().previous();
    });
    expect(moved).toBe(false);
    expect(nav.current().index).toBe(0);

    act(() => void nav.current().goTo(1));
    act(() => {
      moved = nav.current().next();
    });
    expect(moved).toBe(false);
    expect(nav.current().index).toBe(1);
  });

  it('clamps a jump past either end', () => {
    const nav = probe(8);
    act(() => void nav.current().goTo(40));
    expect(nav.current().index).toBe(7);
    act(() => void nav.current().goTo(-3));
    expect(nav.current().index).toBe(0);
  });

  it('pulls the index back inside when the recipe comes back with fewer steps', () => {
    const nav = probe(5);
    act(() => void nav.current().goTo(4));
    nav.rerender(2);
    expect(nav.current()).toMatchObject({ index: 1, isLast: true });
  });

  it('a recipe with no steps sits on index 0 as both first and last', () => {
    const nav = probe(0);
    expect(nav.current()).toMatchObject({ index: 0, isFirst: true, isLast: true });
  });
});
