/**
 * Regression tests for `useAdsReady`.
 *
 * The symptom: on every device a banner appeared a beat AFTER the row it
 * belongs to. The hook re-awaited an answer the launch warmup had already
 * settled, so each slot rendered `null`, resolved an already-resolved promise,
 * set state, and only then mounted the banner — a whole render and a native
 * view creation before the ad request even left. The second test fails against
 * that version: a later slot used to report `false` on its first render.
 *
 * The remembered answer lives in module scope, so these run in order: the "no"
 * case must be asked while the session still has nothing remembered, and it
 * deliberately never answers yes.
 */
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useAdsReady } from '@presentation/base/hooks/ads/use-ads-ready';

const mockPrepare = jest.fn();

jest.mock('@application/ads/get-ads-service', () => ({
  getAdsService: () => ({ prepare: mockPrepare }),
}));

/** Every value the hook returned, in render order. */
const drive = (): boolean[] => {
  const seen: boolean[] = [];
  const Probe = (): null => {
    seen.push(useAdsReady());
    return null;
  };
  renderComponent(<Probe />);
  return seen;
};

const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useAdsReady', () => {
  it('does not remember a no, so a launch that raced the network is asked again', async () => {
    mockPrepare.mockResolvedValue(false);

    drive();
    await flush();

    expect(drive()[0]).toBe(false);
    expect(mockPrepare).toHaveBeenCalledTimes(2);
  });

  it('reports the remembered yes on the FIRST render of a later slot', async () => {
    mockPrepare.mockResolvedValue(true);

    const first = drive();
    expect(first[0]).toBe(false);
    await flush();

    // A later slot is every ad row after the first in a scrolling feed. It must
    // not spend a render waiting for an answer the session already holds — that
    // render is the beat the banner used to arrive behind its row.
    expect(drive()[0]).toBe(true);
  });
});
