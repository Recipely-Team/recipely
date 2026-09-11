/**
 * A function the model may call, declared by the app.
 *
 * `parameters` is a JSON Schema object describing `args`. Providers accept the
 * common subset (`type`, `properties`, `required`, `enum`, `description`,
 * `items`), so a definition written once works across adapters.
 */
export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}
