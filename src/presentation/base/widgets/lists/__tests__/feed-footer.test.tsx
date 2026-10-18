import { act } from 'react-test-renderer';
import { NetworkFailure } from '@core/failure';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

/**
 * Reported as: "the list just stops on a bad connection." A failed next page
 * left the rows and recorded `moreFailure`, but the footer rendered nothing for
 * it — the spinner vanished, the list looked finished, and `onEndReached` never
 * fired again because the content length had not changed. The footer now shows
 * "Couldn't load more · Try again" and the button fetches the page again.
 */
describe('FeedFooter', () => {
  it('offers Try again when the next page failed, and retries on press', () => {
    const onRetry = jest.fn();
    const { root } = renderComponent(
      <FeedFooter isLoadingMore={false} failure={new NetworkFailure('offline')} onRetry={onRetry} />,
    );

    expect(textContent(root)).toEqual([t().errors.loadMoreFailed, t().errors.retry]);
    const retry = root.find((node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
    act(() => (retry.props.onPress as () => void)());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the spinner, not the retry row, while the page is being fetched again', () => {
    const { root } = renderComponent(
      <FeedFooter isLoadingMore failure={new NetworkFailure('offline')} onRetry={jest.fn()} />,
    );

    expect(textContent(root)).toEqual([]);
    expect(root.findAllByType('ActivityIndicator')).toHaveLength(1);
  });

  it('renders nothing at the true end of the list', () => {
    const { root } = renderComponent(<FeedFooter isLoadingMore={false} failure={null} onRetry={jest.fn()} />);

    expect(textContent(root)).toEqual([]);
    expect(root.findAllByType('ActivityIndicator')).toHaveLength(0);
  });
});

/**
 * "Sona gelince zıplıyor, daha fazla tarif yok sanıyor": the footer rendered
 * nothing until the next fetch began, so the bottom of the feed bounced on
 * empty space and read as the end of the recipes.
 */
describe('FeedFooter — the bottom of a paged list', () => {
  const spinners = (root: ReturnType<typeof renderComponent>['root']) =>
    root.findAll((n) => n.props.accessibilityLabel === t().common.loadingMore);

  it('already shows a spinner when more exists, before the next fetch starts', () => {
    const { root } = renderComponent(<FeedFooter isLoadingMore={false} hasMore />);

    expect(spinners(root).length).toBeGreaterThan(0);
  });

  it('says the list is finished when there is no more', () => {
    const { root } = renderComponent(<FeedFooter isLoadingMore={false} hasMore={false} />);

    expect(textContent(root)).toContain(t().common.endOfList);
    expect(spinners(root)).toHaveLength(0);
  });

  it('offers the retry, not a spinner, when the next page failed', () => {
    const { root } = renderComponent(
      <FeedFooter isLoadingMore={false} hasMore failure={new NetworkFailure('offline')} onRetry={jest.fn()} />,
    );

    expect(textContent(root)).toContain(t().errors.retry);
    expect(spinners(root)).toHaveLength(0);
  });
});
