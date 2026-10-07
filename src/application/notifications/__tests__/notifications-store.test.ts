import type { NotificationListResult as ListNotificationsResult } from "@domain/notifications/notification-list-result";
import type { ListNotificationsUseCase } from "@application/notifications/list/list-notifications-use-case";
import type { CountUnreadNotificationsUseCase } from "@application/notifications/list/count-unread-notifications-use-case";
import { configureNotificationsStore } from "@application/notifications/notifications-store";
import type { MarkAllReadUseCase } from "@application/notifications/read/mark-all-read-use-case";
import type { MarkOneReadUseCase } from "@application/notifications/read/mark-one-read-use-case";
import { NetworkFailure, type Failure } from "@core/failure";
import type { Result } from "@core/result/result";
import { fail, ok } from "@core/result/result-helpers";
import { NotificationEntity } from "@domain/notifications/notification-entity";

const makeNotification = (id: string, read: boolean): NotificationEntity => {
  const result = NotificationEntity.create({
    id,
    type: "like",
    senderId: "sender-1",
    senderDisplayName: "Buse",
    senderPhotoUrl: null,
    recipeId: "recipe-1",
    recipeTitle: "Panna Cotta",
    commentId: null,
    draftId: null,
    message: null,
    sourcePlatform: null,
    sourceHandle: null,
    read,
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
  });
  if (!result.ok) throw new Error("Test setup expected a valid Notification");
  return result.value;
};

interface StubConfig {
  listResults?: Result<ListNotificationsResult, Failure>[];
  markResult?: Result<void, Failure>;
  markOneResult?: Result<void, Failure>;
}

const makeStore = (config: StubConfig) => {
  const listResults = config.listResults ?? [];
  const listInputs: { page?: number }[] = [];
  let listIndex = 0;
  let countCalls = 0;
  let markCalls = 0;
  const markOneIds: string[] = [];

  const nextList = (): Result<ListNotificationsResult, Failure> => {
    const result = listResults[Math.min(listIndex, listResults.length - 1)];
    listIndex++;
    return result ?? fail(new NetworkFailure("not configured"));
  };

  const listNotifications = {
    execute: (input: { page?: number } = {}) => {
      listInputs.push(input);
      return Promise.resolve(nextList());
    },
  } as unknown as ListNotificationsUseCase;

  const countUnread = {
    execute: () => {
      countCalls++;
      const result = nextList();
      return Promise.resolve(result.ok ? ok(result.value.unreadCount) : result);
    },
  } as unknown as CountUnreadNotificationsUseCase;

  const markAllRead = {
    execute: () => {
      markCalls++;
      return Promise.resolve(config.markResult ?? ok(undefined));
    },
  } as unknown as MarkAllReadUseCase;

  const markOneRead = {
    execute: (id: string) => {
      markOneIds.push(id);
      return Promise.resolve(config.markOneResult ?? ok(undefined));
    },
  } as unknown as MarkOneReadUseCase;

  const store = configureNotificationsStore({
    listNotifications,
    countUnread,
    markAllRead,
    markOneRead,
  });
  return { store, listInputs, countCallCount: () => countCalls, markCallCount: () => markCalls, markOneIds };
};

const loaded = (
  items: NotificationEntity[],
  unreadCount: number,
): Result<ListNotificationsResult, Failure> =>
  ok({ page: { items, total: items.length, page: 1, pageSize: 20, hasMore: false }, unreadCount });

describe("notifications store — load", () => {
  it("sets the top-level unreadCount alongside the loaded state", async () => {
    const { store } = makeStore({
      listResults: [loaded([makeNotification("n1", false)], 3)],
    });

    await store.getState().load();

    expect(store.getState().unreadCount).toBe(3);
    expect(store.getState().state.status).toBe("loaded");
  });
});

describe("notifications store — refreshUnread", () => {
  it("updates only the unreadCount and leaves the feed untouched", async () => {
    const { store, listInputs, countCallCount } = makeStore({ listResults: [loaded([], 7)] });

    await store.getState().refreshUnread();

    expect(store.getState().unreadCount).toBe(7);
    // Feed was never loaded, so it must remain idle.
    expect(store.getState().state.status).toBe("idle");
    expect(countCallCount()).toBe(1);
    expect(listInputs).toEqual([]);
  });

  it("keeps the previous count when the refresh request fails", async () => {
    const { store } = makeStore({
      listResults: [loaded([], 4), fail(new NetworkFailure("offline"))],
    });

    await store.getState().refreshUnread();
    await store.getState().refreshUnread();

    expect(store.getState().unreadCount).toBe(4);
  });
});

describe("notifications store — markAllRead", () => {
  it("clears the badge and flips loaded items to read", async () => {
    const { store, markCallCount } = makeStore({
      listResults: [
        loaded(
          [makeNotification("n1", false), makeNotification("n2", false)],
          2,
        ),
      ],
    });

    await store.getState().load();
    await store.getState().markAllRead();

    expect(store.getState().unreadCount).toBe(0);
    expect(markCallCount()).toBe(1);
    const state = store.getState().state;
    expect(state.status === "loaded" && state.items.every((n) => n.read)).toBe(
      true,
    );
  });

  it("still clears the badge when the list has not been loaded", async () => {
    const { store, markCallCount } = makeStore({ markResult: ok(undefined) });
    // Seed a stale count without loading the feed.
    store.setState({ unreadCount: 5 });

    await store.getState().markAllRead();

    expect(store.getState().unreadCount).toBe(0);
    expect(markCallCount()).toBe(1);
  });
});

describe("notifications store — markOneRead", () => {
  it("flips only the tapped item to read and decrements both unread counts", async () => {
    const { store, markOneIds } = makeStore({
      listResults: [
        loaded(
          [makeNotification("n1", false), makeNotification("n2", false)],
          2,
        ),
      ],
    });

    await store.getState().load();
    await store.getState().markOneRead("n1");

    expect(markOneIds).toEqual(["n1"]);
    expect(store.getState().unreadCount).toBe(1);
    const state = store.getState().state;
    if (state.status !== "loaded") throw new Error("expected loaded state");
    expect(state.items.find((n) => n.id === "n1")?.read).toBe(true);
    expect(state.items.find((n) => n.id === "n2")?.read).toBe(false);
  });

  it("is a no-op for an already-read item", async () => {
    const { store, markOneIds } = makeStore({
      listResults: [loaded([makeNotification("n1", true)], 0)],
    });

    await store.getState().load();
    await store.getState().markOneRead("n1");

    expect(markOneIds).toEqual([]);
    expect(store.getState().unreadCount).toBe(0);
  });

  it("reloads the feed when the backend rejects the mark", async () => {
    const { store, listInputs } = makeStore({
      listResults: [loaded([makeNotification("n1", false)], 1)],
      markOneResult: fail(new NetworkFailure("offline")),
    });

    await store.getState().load();
    await store.getState().markOneRead("n1");

    // load (1) + reload after failure (1) — the source of truth wins.
    expect(listInputs).toHaveLength(2);
    const state = store.getState().state;
    if (state.status !== "loaded") throw new Error("expected loaded state");
    expect(state.items[0]?.read).toBe(false);
    expect(store.getState().unreadCount).toBe(1);
  });
});

describe("notifications store — paging", () => {
  // Regression: the store read one fixed page, so a user with more than 20 notifications
  // never saw the older ones however far they scrolled.
  it("shows notifications past the first 20 when the user scrolls to the end", async () => {
    const firstPage = Array.from({ length: 20 }, (_, i) => makeNotification(`n${i}`, true));
    const { store, listInputs } = makeStore({
      listResults: [
        ok({ page: { items: firstPage, total: 21, page: 1, pageSize: 20, hasMore: true }, unreadCount: 0 }),
        ok({ page: { items: [makeNotification("n20", false)], total: 21, page: 2, pageSize: 20, hasMore: false }, unreadCount: 1 }),
      ],
    });

    await store.getState().load();
    await store.getState().loadMore();

    expect(listInputs).toEqual([{ page: 1 }, { page: 2 }]);
    const state = store.getState().state;
    if (state.status !== "loaded") throw new Error("expected loaded state");
    expect(state.items).toHaveLength(21);
    expect(state.hasMore).toBe(false);
    expect(store.getState().unreadCount).toBe(1);
  });
});

describe("notifications store — sign-out", () => {
  // Regression: `clear()` ran on sign-out, then a feed answer already in flight wrote the
  // previous account's notifications and badge back into the cleared store.
  it("a feed answer that lands after sign-out does not refill the cleared feed or badge", async () => {
    let resolve: (value: Result<ListNotificationsResult, Failure>) => void = () => undefined;
    const pending = new Promise<Result<ListNotificationsResult, Failure>>((r) => { resolve = r; });
    const store = configureNotificationsStore({
      listNotifications: { execute: () => pending } as unknown as ListNotificationsUseCase,
      countUnread: {} as CountUnreadNotificationsUseCase,
      markAllRead: {} as MarkAllReadUseCase,
      markOneRead: {} as MarkOneReadUseCase,
    });

    const loading = store.getState().load();
    store.getState().clear();
    resolve(loaded([makeNotification("n1", false)], 4));
    await loading;

    expect(store.getState().state.status).toBe("idle");
    expect(store.getState().unreadCount).toBe(0);
  });
});
