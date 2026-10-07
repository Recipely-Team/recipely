import type { Container } from '@core/di/container';
import { registerApplication } from '@application/di/register';
import { createClearSessionCaches } from '@application/di/create-clear-session-caches';

/**
 * The composition smoke test: every feature registrar runs against a container whose
 * ports are inert stand-ins, so a registrar that resolves a missing token or wires a
 * store wrongly fails here instead of at app start.
 */
const inert = (): unknown =>
  new Proxy(() => undefined, {
    get: (_target, key) => (key === 'then' ? undefined : inert()),
    apply: () => inert(),
  });

const containerOfInertPorts = (): Container =>
  ({ has: () => true, resolve: () => inert(), register: () => undefined }) as unknown as Container;

/**
 * Stores with a `clear` / `reset` that deliberately survive sign-out: what they hold does not
 * depend on who is signed in. Every other such store must be wiped by `clearSessionCaches`.
 */
const PUBLIC_STORES: readonly string[] = [
  // `reset` returns the feedback form to idle; it holds no account data.
  'feedbackStore',
];

interface ResettableState {
  clear?: unknown;
  reset?: unknown;
}

const isResettableStore = (value: unknown): boolean => {
  // A bound store is the zustand hook: a function carrying `getState`.
  if (typeof value !== 'function' || !('getState' in value)) return false;
  const { getState } = value;
  if (typeof getState !== 'function') return false;
  const state: ResettableState = getState();
  return typeof state.clear === 'function' || typeof state.reset === 'function';
};

describe('registerApplication', () => {
  it('builds every store from the container without throwing', () => {
    const stores = registerApplication(containerOfInertPorts());
    const entries = Object.entries(stores);

    expect(entries.length).toBeGreaterThan(20);
    for (const [, store] of entries) expect(store).toBeDefined();
  });

  // A user-scoped store left out of the sign-out list leaks the last account's data to the next.
  it('wipes every user-scoped store on sign-out, and no public one', () => {
    const { authStore: _authStore, ...stores } = registerApplication(containerOfInertPorts());
    const resettable: string[] = [];
    const wiped = new Set<string>();
    const recording: Record<string, unknown> = {};
    for (const [key, store] of Object.entries(stores)) {
      if (!isResettableStore(store)) {
        recording[key] = store;
        continue;
      }
      resettable.push(key);
      const record = (): void => {
        wiped.add(key);
      };
      recording[key] = { getState: () => ({ clear: record, reset: record }) };
    }

    createClearSessionCaches(recording as unknown as typeof stores)();

    const userScoped = resettable.filter((key) => !PUBLIC_STORES.includes(key)).sort();
    expect([...wiped].sort()).toEqual(userScoped);
    expect(resettable).toEqual(expect.arrayContaining([...PUBLIC_STORES]));
  });
});
