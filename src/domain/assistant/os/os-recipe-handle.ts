/**
 * The least a recipe needs to be nameable out loud before the app has run.
 *
 * Siri resolves "open the köfte recipe" against a catalogue on disk — an
 * intent has no session and often no network — and Android resolves the same
 * sentence against its dynamic shortcuts. Both are fed from this.
 */
export interface OsRecipeHandle {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
}
