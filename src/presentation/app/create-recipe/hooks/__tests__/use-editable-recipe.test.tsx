import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useEditableRecipe } from '@presentation/app/create-recipe/hooks/use-editable-recipe';

/** The hook starts with one blank row on each list, so assertions are deltas. */
function drive() {
  let latest!: ReturnType<typeof useEditableRecipe>;
  const Probe = (): null => {
    latest = useEditableRecipe();
    return null;
  };
  renderComponent(<Probe />);
  return { latest: () => latest };
}

describe('useEditableRecipe — adding rows', () => {
  /**
   * The "+" button is wired `onPress={onAdd}`, and React Native calls
   * `onPress` WITH the gesture event. When `onAddStep` briefly took an
   * optional value, a plain tap pushed a `GestureResponderEvent` into
   * `instructions: string[]` — it rendered as an object inside a `TextInput`
   * and rode into publish. The prop is declared `() => void` at three levels,
   * and a function of fewer parameters is assignable where more are expected,
   * so neither the types nor any test objected.
   */
  it('ignores whatever an event handler passes it', () => {
    const { latest } = drive();
    const gestureEvent = { nativeEvent: { locationX: 12 } } as unknown as never;

    act(() => {
      (latest().onAddStep as (event: never) => void)(gestureEvent);
      (latest().onAddIngredient as (event: never) => void)(gestureEvent);
    });

    // Two blank rows on each: the one the hook starts with, and the one the
    // tap added. An event object anywhere here is the bug.
    expect(latest().recipe.instructions).toEqual(['', '']);
    expect(latest().recipe.ingredients).toEqual(['', '']);
  });

  it('adds a blank row for the button', () => {
    const { latest } = drive();

    act(() => {
      latest().onAddIngredient();
      latest().onAddStep();
    });

    expect(latest().recipe.ingredients).toEqual(['', '']);
    expect(latest().recipe.instructions).toEqual(['', '']);
  });

  // Two calls in one turn: the assistant's path, which must not depend on a
  // re-render happening between them.
  it('appends two filled rows in one tick without either overwriting the other', () => {
    const { latest } = drive();

    act(() => {
      latest().onAppendIngredient('2 yumurta');
      latest().onAppendIngredient('200 g un');
      latest().onAppendStep('Yoğur');
      latest().onAppendStep('Pişir');
    });

    expect(latest().recipe.ingredients).toEqual(['', '2 yumurta', '200 g un']);
    expect(latest().recipe.instructions).toEqual(['', 'Yoğur', 'Pişir']);
  });
});
