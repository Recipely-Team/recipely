/**
 * Following a creator promised their new recipes and delivered nothing. The
 * backend now sends `creator_recipe` when a followed creator publishes; this
 * pins the row the prototype draws for it: the creator's avatar, "New recipe
 * from {creator}" with the name in the language's own word order, then the
 * recipe title, and a tap that opens the recipe.
 */

import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { NotifRow } from '@presentation/app/notifications/items/notif-row';
import type { NotifItem } from '@presentation/app/notifications/model/notif-item';
import { NotifKind } from '@presentation/app/notifications/model/notif-kind';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});

const item: NotifItem = {
  id: 'n1',
  kind: NotifKind.CreatorRecipe,
  actor: 'Refika',
  recipeName: 'Menemen',
  daysAgo: 0,
  read: false,
  target: { kind: 'recipe', recipeId: 'r1' },
} as NotifItem;

describe('NotifRow — a followed creator’s new recipe', () => {
  it('names the creator and the recipe, and draws no icon disc', () => {
    const { root } = renderComponent(<NotifRow item={item} onTap={jest.fn()} />);
    const text = textContent(root).join('|');
    const [before] = t().notifications.newRecipeFrom.split('{creator}');
    expect(text).toContain('Refika');
    expect(text).toContain('Menemen');
    expect(text).toContain((before ?? '').trim());
    expect(text).not.toContain('icon:');
  });

  it('reads as one sentence to a screen reader', () => {
    const { root } = renderComponent(<NotifRow item={item} onTap={jest.fn()} />);
    const label = root.findAll((n) => typeof n.props['accessibilityLabel'] === 'string')[0]?.props['accessibilityLabel'];
    expect(label).toBe(`${t().notifications.newRecipeFrom.replace('{creator}', 'Refika')}: Menemen`);
  });

  it('opens the recipe on tap', () => {
    const onTap = jest.fn();
    const { root } = renderComponent(<NotifRow item={item} onTap={onTap} />);
    (root.findAll((n) => typeof n.props['onPress'] === 'function')[0]?.props['onPress'] as () => void)();
    expect(onTap).toHaveBeenCalledWith(item);
  });
});
