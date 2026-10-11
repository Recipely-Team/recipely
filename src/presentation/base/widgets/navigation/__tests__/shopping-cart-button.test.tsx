import { act } from 'react-test-renderer';
import { byRole, renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ShoppingCartButton } from '@presentation/base/widgets/navigation/shopping-cart-button';
import { t } from '@presentation/i18n';

let mockToBuy: number | null = 0;
let mockGuest = false;
const mockPush = jest.fn();
const mockLoadToBuy = jest.fn(async () => undefined);

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));
jest.mock('@presentation/bootstrap/use-stores', () => {
  const shoppingListStore = Object.assign(
    jest.fn((selector: (state: { toBuy: number | null }) => unknown) => selector({ toBuy: mockToBuy })),
    { getState: () => ({ loadToBuy: mockLoadToBuy }) },
  );
  return {
    useStores: jest.fn(() => ({
      shoppingListStore,
      authStore: jest.fn((selector: (state: { state: { status: string } }) => unknown) =>
        selector({ state: { status: mockGuest ? 'unauthenticated' : 'authenticated' } }),
      ),
    })),
  };
});

describe('ShoppingCartButton', () => {
  beforeEach(() => {
    mockToBuy = 0;
    mockGuest = false;
    mockPush.mockClear();
    mockLoadToBuy.mockClear();
  });

  // --- regression: the shopping list was reachable only from a row deep in Profile.
  it('opens the shopping list from any tab bar', () => {
    const { root } = renderComponent(<ShoppingCartButton />);
    act(() => (byRole(root, 'button').props.onPress as () => void)());
    expect(mockPush).toHaveBeenCalledWith('/shopping-list');
  });

  it('asks the server for the count once signed in', () => {
    renderComponent(<ShoppingCartButton />);
    expect(mockLoadToBuy).toHaveBeenCalledTimes(1);
  });

  it('shows the to-buy count in the badge and the label, and 99+ past 99', () => {
    mockToBuy = 7;
    const seven = renderComponent(<ShoppingCartButton />);
    expect(textContent(seven.root)).toContain('7');
    expect(byRole(seven.root, 'button').props.accessibilityLabel).toBe(t().shopping.cartA11y.replace('{n}', '7'));
    mockToBuy = 140;
    expect(textContent(renderComponent(<ShoppingCartButton />).root)).toContain('99+');
  });

  it('tells a guest why to sign in, and does not ask for a count', () => {
    mockGuest = true;
    const { root } = renderComponent(<ShoppingCartButton />);
    act(() => (byRole(root, 'button').props.onPress as () => void)());
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLoadToBuy).not.toHaveBeenCalled();
    expect(textContent(root)).toContain(t().signInPrompt.shoppingList);
  });
});
