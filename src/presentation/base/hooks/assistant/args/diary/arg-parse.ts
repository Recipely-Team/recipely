/**
 * What a diary arg parser answers: the value, or the machine-readable reason
 * the model is sent back so it can fix the call.
 */
export type ArgParse<T> = { ok: true; value: T } | { ok: false; error: string };
