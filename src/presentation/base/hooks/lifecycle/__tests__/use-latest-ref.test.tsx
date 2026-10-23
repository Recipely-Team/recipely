/**
 * `useLatestRef` hands a callback that outlives its render the value from the
 * latest COMMITTED render — the job a ref written during render used to do,
 * without the write the React Compiler refuses.
 */
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { RefObject } from 'react';
import { useLatestRef } from '@presentation/base/hooks/lifecycle/use-latest-ref';

const probe = { ref: null as RefObject<string> | null };

const Probe = ({ value }: { value: string }): null => {
  probe.ref = useLatestRef(value);
  return null;
};

it('reads the value of the latest render through the same ref object', () => {
  let view!: ReactTestRenderer;
  act(() => {
    view = create(<Probe value="first" />);
  });
  const first = probe.ref;
  expect(first?.current).toBe('first');

  act(() => view.update(<Probe value="second" />));

  expect(probe.ref).toBe(first);
  expect(first?.current).toBe('second');
  act(() => view.unmount());
});
