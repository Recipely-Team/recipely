/**
 * The Explore creators strip: drawn only when there is a creator to show, and
 * every tap goes where the prototype links it — a creator to /creators/[id],
 * "See all" to /creators.
 */
import { act, type ReactTestInstance } from 'react-test-renderer';
import { create } from 'zustand';
import { NetworkFailure } from '@core/failure';
import { StoreStatus } from '@application/store/store-status';
import type { CreatorsStoreState } from '@application/creators/creators-store-state';
import type { CreatorsListState } from '@application/creators/list/creators-list-state';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { CreatorsStrip } from '@presentation/app/recipes/items/creators/creators-strip';
import { t } from '@presentation/i18n';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const storeWith = (creators: CreatorSummaryEntity[], listState: CreatorsListState) => {
  const load = jest.fn(async () => undefined);
  const store = create<CreatorsStoreState>(() => ({
    creators,
    listState,
    load,
    refresh: jest.fn(async () => undefined),
    loadMore: jest.fn(async () => undefined),
  }));
  return { store, load };
};

const loaded: CreatorsListState = { status: StoreStatus.Loaded, page: 1, hasMore: false };

const buttonNamed = (root: ReactTestInstance, label: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

describe('CreatorsStrip', () => {
  beforeEach(() => mockPush.mockClear());

  it('asks the store for creators when it mounts', () => {
    const { store, load } = storeWith([], { status: StoreStatus.Idle });
    renderComponent(<CreatorsStrip />, { creatorsStore: store });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('is not drawn when the list came back empty', () => {
    const { store } = storeWith([], loaded);
    const { root } = renderComponent(<CreatorsStrip />, { creatorsStore: store });

    expect(textContent(root)).not.toContain(t().creators.title);
    expect(textContent(root)).not.toContain(t().creators.seeAll);
  });

  it('is not drawn when the first load failed', () => {
    const { store } = storeWith([], { status: StoreStatus.Error, failure: new NetworkFailure('offline') });
    const { root } = renderComponent(<CreatorsStrip />, { creatorsStore: store });

    expect(textContent(root)).not.toContain(t().creators.title);
    expect(textContent(root)).not.toContain(t().creators.seeAll);
  });

  it('shows each creator by name and handle under the heading', () => {
    const { store } = storeWith([creatorSummaryOf('7')], loaded);
    const { root } = renderComponent(<CreatorsStrip />, { creatorsStore: store });

    const texts = textContent(root);
    expect(texts).toEqual(expect.arrayContaining([t().creators.title, 'Creator 7', '@chef_7']));
  });

  it("opens a creator's page when their item is tapped", () => {
    const creator = creatorSummaryOf('7');
    const { store } = storeWith([creator], loaded);
    const { root } = renderComponent(<CreatorsStrip />, { creatorsStore: store });

    const item = root.find(
      (node) => node.props.accessibilityRole === 'button' && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Creator 7') && typeof node.props.onPress === 'function',
    );
    act(() => (item.props.onPress as () => void)());

    expect(mockPush).toHaveBeenCalledWith('/creators/7');
  });

  it('opens /creators from "See all"', () => {
    const { store } = storeWith([creatorSummaryOf('7')], loaded);
    const { root } = renderComponent(<CreatorsStrip />, { creatorsStore: store });

    act(() => (buttonNamed(root, t().creators.seeAll).props.onPress as () => void)());

    expect(mockPush).toHaveBeenCalledWith('/creators');
  });
});
