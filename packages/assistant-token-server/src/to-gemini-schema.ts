const TYPE_KEY = 'type';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A `ToolDefinition`'s JSON Schema in the form Gemini's `parameters` is known
 * to accept: every `type` spelled as its upper-case enum name (`object` →
 * `OBJECT`), at every depth — properties, items, anything nested.
 *
 * The upper-case form is the one measured against the Live API (a production
 * app has declared its tool that way since the feature shipped); normalising
 * to it means a definition written in ordinary JSON Schema never depends on
 * how forgiving the API happens to be about case.
 */
export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!isRecord(schema)) return schema;

  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [
      key,
      key === TYPE_KEY && typeof value === 'string' ? value.toUpperCase() : toGeminiSchema(value),
    ]),
  );
}
