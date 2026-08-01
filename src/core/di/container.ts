/**
 * Lightweight dependency-injection container that maps symbol tokens to lazy
 * singleton factories. Resolving an unregistered token throws immediately
 * because that is always a programmer error, not a recoverable runtime failure.
 *
 * @remarks
 * The app's single instance lives at the bottom of this file. It had a file of
 * its own, which meant the class and the only thing anyone ever constructs from
 * it were two hops apart; `container` is not a second concept, it is this one.
 */
export class Container {
  private factories = new Map<symbol, () => unknown>();
  private instances = new Map<symbol, unknown>();

  register<T>(token: symbol, factory: () => T): void {
    this.factories.set(token, factory);
    this.instances.delete(token);
  }

  /** Returns true when a factory is registered for the token. */
  has(token: symbol): boolean {
    return this.factories.has(token);
  }

  resolve<T>(token: symbol): T {
    const cached = this.instances.get(token);
    if (cached !== undefined) {
      return cached as T;
    }
    const factory = this.factories.get(token);
    if (!factory) {
      // WHY: resolving an unregistered token is a programmer error, not a runtime failure path.
      throw new Error(`No factory registered for token: ${token.toString()}`);
    }
    const created = factory() as T;
    this.instances.set(token, created);
    return created;
  }

  reset(): void {
    this.factories.clear();
    this.instances.clear();
  }
}

/** The app's container. Composition roots register into it; call sites resolve from it. */
export const container = new Container();
