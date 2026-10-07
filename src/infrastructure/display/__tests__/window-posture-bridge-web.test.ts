import { FoldOrientation } from '@domain/display/fold-orientation';
import { FoldState } from '@domain/display/fold-state';
import { WindowPostureBridge } from '@infrastructure/display/window-posture-bridge.web';

// The Viewport Segments API and Device Posture API exist only in Chromium; the
// test installs them on the jsdom-less global the way the browser exposes them.
interface FakeQuery {
  matches: boolean;
  listeners: Set<() => void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

const queries = new Map<string, FakeQuery>();
const windowListeners = new Set<() => void>();
const target = globalThis as Record<string, unknown>;

const fakeQuery = (query: string): FakeQuery => {
  const existing = queries.get(query);
  if (existing !== undefined) return existing;
  const listeners = new Set<() => void>();
  const created: FakeQuery = {
    matches: false,
    listeners,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  queries.set(query, created);
  return created;
};

const segments = (...rects: [number, number, number, number][]): { segments: object[] } => ({
  segments: rects.map(([x, y, width, height]) => ({ x, y, width, height })),
});

const fireQueryChange = (): void => queries.forEach((query) => query.listeners.forEach((listener) => listener()));

beforeEach(() => {
  queries.clear();
  windowListeners.clear();
  target.window = target;
  target.matchMedia = jest.fn(fakeQuery);
  target.addEventListener = (_type: string, listener: () => void) => windowListeners.add(listener);
  target.removeEventListener = (_type: string, listener: () => void) => windowListeners.delete(listener);
  delete target.viewport;
});

afterAll(() => {
  delete target.viewport;
});

describe('WindowPostureBridge (web) — Viewport Segments API', () => {
  it('reads a spanned Duo held as a book as a 34 px vertical hinge between the segments', () => {
    target.viewport = segments([0, 0, 540, 720], [574, 0, 540, 720]);

    expect(new WindowPostureBridge().current()).toEqual({
      isSeparating: true,
      orientation: FoldOrientation.Vertical,
      state: FoldState.Flat,
      hinge: { x: 540, y: 0, width: 34, height: 720 },
    });
  });

  it('reads stacked segments as a horizontal hinge', () => {
    target.viewport = segments([0, 0, 720, 540], [0, 574, 720, 540]);

    expect(new WindowPostureBridge().current()).toMatchObject({
      orientation: FoldOrientation.Horizontal,
      hinge: { x: 0, y: 540, width: 720, height: 34 },
    });
  });

  it('answers null on one segment, on malformed segments, and where the API is missing', () => {
    const bridge = new WindowPostureBridge();

    expect(bridge.current()).toBeNull();
    target.viewport = segments([0, 0, 1114, 720]);
    expect(bridge.current()).toBeNull();
    target.viewport = { segments: [{ x: 0 }, { x: 574 }] };
    expect(bridge.current()).toBeNull();
    target.viewport = { segments: null };
    expect(bridge.current()).toBeNull();
  });

  it('reports spanning when the segment media query changes, once per real change', () => {
    const bridge = new WindowPostureBridge();
    const listener = jest.fn();
    const unsubscribe = bridge.subscribe(listener);

    target.viewport = segments([0, 0, 540, 720], [574, 0, 540, 720]);
    fireQueryChange();
    windowListeners.forEach((fire) => fire());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ orientation: FoldOrientation.Vertical }));

    target.viewport = segments([0, 0, 1114, 720]);
    windowListeners.forEach((fire) => fire());
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    expect(windowListeners.size).toBe(0);
    queries.forEach((query) => expect(query.listeners.size).toBe(0));
  });
});
