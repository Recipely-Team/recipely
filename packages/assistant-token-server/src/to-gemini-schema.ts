const TYPE_KEY = 'type';
const NULL_TYPE = 'null';
/** Keys whose values are data, not schema — a `type` inside them is left exactly as written. */
const DATA_KEYS: ReadonlySet<string> = new Set(['default', 'example', 'examples', 'const', 'enum']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A `ToolDefinition`'s JSON Schema in the form Gemini's `parameters` is known
 * to accept: every `type` spelled as its upper-case enum name (`object` →
 * `OBJECT`), at every schema depth.
 *
 * @remarks
 * - **The upper-case form is the measured one** (a production app has declared
 *   its tool that way since the feature shipped); normalising to it means a
 *   definition written in ordinary JSON Schema never depends on how forgiving
 *   the API is about case.
 * - **`type: ['string', 'null']` becomes `type: 'STRING', nullable: true`** —
 *   Gemini's schema has no type unions; `nullable` is its spelling of the one
 *   union JSON Schema commonly uses.
 * - **Data is not schema.** `default`, `example(s)`, `const` and `enum` hold
 *   values, so a `type` key inside them is left untouched.
 */
export function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!isRecord(schema)) return schema;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (DATA_KEYS.has(key)) out[key] = value;
    else if (key === TYPE_KEY && typeof value === 'string') out[key] = value.toUpperCase();
    else if (key === TYPE_KEY && Array.isArray(value)) {
      const types = value.filter((t): t is string => typeof t === 'string');
      const concrete = types.filter((t) => t !== NULL_TYPE);
      if (concrete[0] !== undefined) out[key] = concrete[0].toUpperCase();
      if (types.includes(NULL_TYPE)) out.nullable = true;
    } else out[key] = toGeminiSchema(value);
  }
  return out;
}
