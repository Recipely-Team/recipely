/**
 * The values the app compares React Native's `AppStateStatus` against.
 *
 * @remarks
 * - **Why infrastructure and not `presentation/base/constants`**, where it
 *   started: the crash sentinel discriminates on the same three words, and
 *   infrastructure cannot reach presentation. A vocabulary is defined once and
 *   pointed at from everywhere else (CLAUDE.md rule 5), so it moved DOWN to the
 *   layer everyone can reach rather than being spelled a second time.
 *   `infrastructure/constants/*` is importable from any layer by design.
 * - **`active`** — the moment a backgrounded app comes back and has to catch up
 *   on what happened while it was away.
 * - **`background`, and why `inactive` is not with it.** iOS passes through
 *   `inactive` for a control-centre swipe, an incoming call, or the app
 *   switcher. Only `background` means the user actually left, which is the
 *   distinction the crash sentinel is built on: treating `inactive` as leaving
 *   would erase the marker of a session that is still running.
 *
 * React Native publishes the `AppStateStatus` TYPE but no value catalogue, so
 * unlike expo's `PermissionStatus` there is nothing upstream to point at.
 */
export const AppStateStatusValue = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
} as const;
