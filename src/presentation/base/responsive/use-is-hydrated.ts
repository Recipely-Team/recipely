import { useSyncExternalStore } from 'react';

/** Nothing ever changes after hydration, so there is nothing to subscribe to. */
const subscribe = (): (() => void) => () => undefined;
const onClient = (): boolean => true;
const onServer = (): boolean => false;

/**
 * Returns `false` during the server prerender and the hydration render, then
 * `true`. Gate any value that differs between the static export (no viewport,
 * no `prefers-color-scheme`) and the live browser — e.g.
 * `useWindowDimensions()` or `useColorScheme()` — behind this so the first
 * client render reproduces the server HTML exactly and React can hydrate without
 * a text/markup mismatch (React error #418).
 *
 * @remarks
 * - **`useSyncExternalStore`'s server snapshot is exactly this switch.** React
 *   renders the hydration pass with the server snapshot and re-renders with the
 *   client one straight after; a root that is not hydrating (native, and the web
 *   dev server) starts on the client snapshot and spends no extra render.
 */
export const useIsHydrated = (): boolean => useSyncExternalStore(subscribe, onClient, onServer);
