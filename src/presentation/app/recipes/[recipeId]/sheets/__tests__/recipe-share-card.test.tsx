import { Platform, View } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { RecipeShareCard } from '@presentation/app/recipes/[recipeId]/sheets/recipe-share-card';

const render = () =>
  renderComponent(
    <RecipeShareCard recipeName="Menemen" totalMinutes={20} servings={2} ingredients={['eggs']} onReady={jest.fn()} />,
  );
const cardView = (root: ReturnType<typeof render>['root']) => root.findAllByType(View)[0];

// Regression: `collapsable={false}` is native-only. On the web React wrote it
// to the DOM and warned "Received `false` for a non-boolean attribute
// `collapsable`", a red toast on every signed-in page of a dev build.
describe('RecipeShareCard', () => {
  it('does not hand the native-only collapsable prop to the web DOM', () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'web');
    try {
      expect(cardView(render().root)?.props['collapsable']).toBeUndefined();
    } finally {
      platform.restore();
    }
  });

  it('keeps the view un-flattened on native so it can be captured as an image', () => {
    const platform = jest.replaceProperty(Platform, 'OS', 'ios');
    try {
      expect(cardView(render().root)?.props['collapsable']).toBe(false);
    } finally {
      platform.restore();
    }
  });
});
