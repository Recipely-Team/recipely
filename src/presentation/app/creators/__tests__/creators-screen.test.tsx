/**
 * CreatorsScreen (/creators): the grid over the same creators store as the
 * Explore strip — cards when there are creators, an empty note when the list
 * came back empty, and a card opens the creator's page.
 */
import { act, type ReactTestInstance } from 'react-test-renderer';
import { create } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import type { CreatorsStoreState } from '@application/creators/creators-store-state';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { CreatorsScreen } from '@presentation/app/creators';
import { t } from '@presentation/i18n';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));

const storeOf = (creators: CreatorSummaryEntity[]) =>
  create<CreatorsStoreState>(() => ({
    creators,
    listState: { status: StoreStatus.Loaded, page: 1, hasMore: false },
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

  it('says there are none yet when the list is empty', () => {
    const { root } = renderComponent(<CreatorsScreen />, { creatorsStore: storeOf([]) });

    expect(textContent(root)).toContain(t().creators.empty);
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
