/**
 * **Crash reporting port** — where code below presentation sends an error it
 * handled but must not hide.
 *
 * @remarks
 * - For best-effort work that keeps going after a failure (a reminder that
 *   could not be scheduled): the user sees nothing, the team still does.
 */
export interface CrashReporterInterface {
  record(error: unknown, context: string): void;
}
