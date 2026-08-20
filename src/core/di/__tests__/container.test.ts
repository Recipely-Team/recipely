import { Container } from "@core/di/container";

const TOKEN = Symbol.for("test.service");

describe("Container", () => {
  it("resolves a registered factory and caches the instance", () => {
    const c = new Container();
    let calls = 0;
    c.register(TOKEN, () => {
      calls++;
      return { id: calls };
    });

    const a = c.resolve<{ id: number }>(TOKEN);
    const b = c.resolve<{ id: number }>(TOKEN);

    expect(a).toBe(b);
    expect(calls).toBe(1);
  });

  it("reset clears factories and instances", () => {
    const c = new Container();
    c.register(TOKEN, () => ({ id: 1 }));
    c.resolve(TOKEN);

    c.reset();

    expect(() => c.resolve(TOKEN)).toThrow();
  });

  it("throws when resolving an unregistered token", () => {
    const c = new Container();

    expect(() => c.resolve(Symbol.for("nope"))).toThrow(
      /No factory registered/,
    );
  });
});
