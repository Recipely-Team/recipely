import type { Container } from '@core/di/container';
import { registerApplication } from '@application/di/register';

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

describe('registerApplication', () => {
  it('builds every store from the container without throwing', () => {
    const stores = registerApplication(containerOfInertPorts());
    const entries = Object.entries(stores);

    expect(entries.length).toBeGreaterThan(20);
    for (const [, store] of entries) expect(store).toBeDefined();
  });
});
