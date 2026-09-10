/**
 * A recipe the OS may resolve by name before the app has ever launched.
 *
 * Siri answers "open the köfte recipe" from this catalogue, not from the API:
 * an `AppEntity` query runs in the intent's own process with no network and no
 * session, so whatever the user can name out loud has to already be on disk.
 */
export interface OsEntityEntry {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
}
