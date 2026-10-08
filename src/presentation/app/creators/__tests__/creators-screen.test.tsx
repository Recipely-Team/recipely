import { RoutePaths } from '@presentation/base/constants';
/**
 * CreatorsScreen (/creators): the grid over the same creators store as the
 * Explore strip — cards when there are creators, an empty note when the list
 * came back empty, and a card opens the creator's page.
 */
import { act, type ReactTestInstance } from 'react-test-renderer';
import { create } from 'zustand';
import { loadedList } from '@application/store/paging/loaded-list';
import { creatorPageOf } from '@application/__fixtures__/creator-page-of';
import type { CreatorsStoreState } from '@application/creators/creators-store-state';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { CreatorsScreen } from '@presentation/app/creators';
import { t } from '@presentation/i18n';

const mockPush = jest.fn();
jest.mock('@presentation/base/widgets/navigation/notifications-bell-button', () => ({
  NotificationsBellButton: (): null => null,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));

const storeOf = (creators: CreatorSummaryEntity[]) =>
  create<CreatorsStoreState>(() => ({
    creators: loadedList(creatorPageOf(creators)),
    load: jest.fn(async () => undefined),
    refresh: jest.fn(async () => undefined),
    loadMore: jest.fn(async () => undefined),
  }));

// AppThemeProvider hydrates its preference asynchronously; let it settle inside act.
afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});

describe('CreatorsScreen', () => {
  beforeEach(() => mockPush.mockClear());

  it('lists every creator as a card under the intro', () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([creatorSummaryOf('1'), creatorSummaryOf('2')]) });

    expect(textContent(root)).toEqual(
      expect.arrayContaining([t().creators.title, t().creators.listSubtitle, 'Creator 1', 'Creator 2']),
    );
  });

  // The Chefs tab is a root tab: the tab bar takes the user elsewhere, so there is no back button.
  it('has no back button', () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([creatorSummaryOf('1')]) });

    expect(root.findAll((n) => n.props.accessibilityLabel === t().creators.back && typeof n.props.onPress === 'function')).toHaveLength(0);
  });

  // The Chefs grid pages as it scrolls: reaching the end asks the store for the next page.
  it('asks the store for the next page when the grid reaches its end', () => {
    const creatorsStore = storeOf([creatorSummaryOf('1'), creatorSummaryOf('2')]);
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore });

    const list = root.find((n) => typeof n.props.onEndReached === 'function' && n.props.numColumns !== undefined);
    act(() => (list.props.onEndReached as () => void)());

    expect(creatorsStore.getState().loadMore).toHaveBeenCalledTimes(1);
  });

  it('shows the coming-soon placeholder, without the grid subtitle, when the list is empty', () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([]) });

    const text = textContent(root);
    expect(text).toContain(t().creators.comingSoon.title);
    expect(text).toContain(t().creators.comingSoon.pill);
    expect(text).not.toContain(t().creators.listSubtitle);
  });

  it('sends a would-be creator to the creator account section of Edit profile', () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([]) });

    const apply = root.find(
      (node: ReactTestInstance) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function' && textContent(node).includes(t().creators.comingSoon.apply),
    );
    act(() => (apply.props.onPress as () => void)());

    expect(mockPush).toHaveBeenCalledWith(RoutePaths.editProfileCreatorAccount);
  });

  it('shows the grid subtitle once there are chefs', () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([creatorSummaryOf('1')]) });

    expect(textContent(root)).toContain(t().creators.listSubtitle);
  });

  it("opens a creator's page from their card", () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([creatorSummaryOf('1')]) });

    const card = root.find(
      (node: ReactTestInstance) =>
        typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Creator 1') && typeof node.props.onPress === 'function',
    );
    act(() => (card.props.onPress as () => void)());

    expect(mockPush).toHaveBeenCalledWith('/creators/1');
  });
});
