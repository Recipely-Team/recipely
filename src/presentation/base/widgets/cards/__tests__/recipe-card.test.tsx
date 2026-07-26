/**
 * `RecipeCard`'s `tags` prop is optional (lean `RecipeSummaryEntity` list contexts
 * omit it entirely) — the tags-chip row must simply be absent rather than
 * crash or render empty chips when `tags` is undefined.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RecipeCard } from '@presentation/base/widgets/cards/recipe-card';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { MaterialCommunityIcons: Icon };
});

const baseProps = {
  name: 'Tomato Soup',
  image: '',
  cuisine: 'Italian',
  difficulty: 'easy',
  rating: 4.5,
  onPress: jest.fn(),
};

describe('RecipeCard — tags', () => {
  it('renders without a tags prop (lean RecipeSummaryEntity list contexts)', () => {
    expect(() => renderComponent(<RecipeCard {...baseProps} />)).not.toThrow();
  });

  it('shows no tag chips when tags is omitted', () => {
    const { root } = renderComponent(<RecipeCard {...baseProps} />);

    expect(textContent(root)).not.toContain('vegan');
  });

  it('shows tag chips when tags is provided', () => {
    const { root } = renderComponent(<RecipeCard {...baseProps} tags={['vegan', 'quick']} />);

    const texts = textContent(root);
    expect(texts).toContain('vegan');
    expect(texts).toContain('quick');
  });
});
